import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const VOTE_URL = "https://functions.poehali.dev/ab122f27-9496-402b-a89e-b78c74ddbe32";

interface Vote {
  id: number;
  phone: string | null;
  comment: string | null;
  ip: string;
  approved: boolean;
  created_at: string;
}

function getAdminHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("admin_token");
  return token ? { "X-Admin-Token": token } : {};
}

export function AdminVotesTab() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(VOTE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminHeaders() },
        body: JSON.stringify({ action: "list" }),
      });
      const data = await res.json();
      setVotes(data.votes || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: number, action: "approve" | "reject") {
    setActionId(id);
    try {
      await fetch(VOTE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminHeaders() },
        body: JSON.stringify({ action, id }),
      });
      setVotes(v => v.map(vote => vote.id === id ? { ...vote, approved: action === "approve" } : vote));
    } finally {
      setActionId(null);
    }
  }

  useEffect(() => { load(); }, []);

  const approved = votes.filter(v => v.approved);
  const pending = votes.filter(v => !v.approved);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-foreground text-xl">Голоса за «Быстрый ответ»</h2>
          <p className="text-sm text-muted-foreground font-body mt-0.5">
            Всего: <b>{votes.length}</b> · Одобрено: <b>{approved.length}</b> · Ожидают: <b>{pending.length}</b>
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-xl text-sm font-body hover:bg-muted/50 transition-colors"
        >
          <Icon name="RefreshCw" size={14} /> Обновить
        </button>
      </div>

      {votes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground font-body text-sm">
          Голосов пока нет
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-foreground text-sm uppercase tracking-wide mb-3 text-amber-600">
            Ожидают одобрения ({pending.length})
          </h3>
          <div className="space-y-2">
            {pending.map(vote => (
              <VoteRow key={vote.id} vote={vote} actionId={actionId} onAction={handleAction} />
            ))}
          </div>
        </div>
      )}

      {approved.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-foreground text-sm uppercase tracking-wide mb-3 text-green-600">
            Одобрены ({approved.length})
          </h3>
          <div className="space-y-2">
            {approved.map(vote => (
              <VoteRow key={vote.id} vote={vote} actionId={actionId} onAction={handleAction} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VoteRow({ vote, actionId, onAction }: {
  vote: Vote;
  actionId: number | null;
  onAction: (id: number, action: "approve" | "reject") => void;
}) {
  const isProcessing = actionId === vote.id;
  const date = new Date(vote.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`bg-white border rounded-xl p-4 flex items-start gap-4 ${vote.approved ? "border-green-200" : "border-border"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${vote.approved ? "bg-green-100" : "bg-amber-100"}`}>
        <Icon name={vote.approved ? "CheckCircle" : "Clock"} size={16} className={vote.approved ? "text-green-600" : "text-amber-600"} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-body font-semibold text-foreground text-sm">
            {vote.phone || <span className="text-muted-foreground italic">телефон не указан</span>}
          </span>
          <span className="text-xs text-muted-foreground font-body">{date}</span>
        </div>
        {vote.comment && (
          <p className="text-xs text-muted-foreground font-body leading-relaxed">{vote.comment}</p>
        )}
        <p className="text-xs text-muted-foreground/60 font-body mt-0.5">IP: {vote.ip}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {!vote.approved && (
          <button
            onClick={() => onAction(vote.id, "approve")}
            disabled={isProcessing}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-xs font-body font-semibold transition-colors"
          >
            {isProcessing ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Check" size={12} />}
            Одобрить
          </button>
        )}
        {vote.approved && (
          <button
            onClick={() => onAction(vote.id, "reject")}
            disabled={isProcessing}
            className="flex items-center gap-1 px-3 py-1.5 border border-border hover:bg-muted/50 disabled:opacity-50 text-muted-foreground rounded-lg text-xs font-body transition-colors"
          >
            {isProcessing ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="X" size={12} />}
            Отозвать
          </button>
        )}
      </div>
    </div>
  );
}
