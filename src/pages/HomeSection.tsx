import { useState } from "react";
import Icon from "@/components/ui/icon";
import { NUMBERS, LAST_UPDATED, PhoneNumber } from "./data";
import PromoBanner from "@/components/PromoBanner";

type IconName = Parameters<typeof Icon>[0]["name"];

const SEND_SUGGESTION_URL = "https://functions.poehali.dev/0c640a47-5d45-45cb-901c-c7ba1f48d5ea";

function NumberForm() {
  const [mode, setMode] = useState<"add" | "edit" | "photo">("add");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PhoneNumber | null>(null);
  const [form, setForm] = useState({ number: "", name: "", description: "", procedure: "", category: "", contactInfo: "" });
  const [photoForm, setPhotoForm] = useState({ number: "", experience: "", agreed: false, contactInfo: "" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const suggestions = mode === "edit" && search.length >= 1
    ? NUMBERS.filter((n) =>
        n.number.includes(search) ||
        n.name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : [];

  function selectNumber(n: PhoneNumber) {
    setSelected(n);
    setSearch(n.number + " — " + n.name);
    setForm({
      number: n.number,
      name: n.name,
      description: n.description,
      procedure: n.procedure ?? "",
      category: n.category,
    });
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    setLoading(true);
    setSubmitError("");
    try {
      const res = await fetch(SEND_SUGGESTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, ...form, contact_info: form.contactInfo }),
      });
      if (!res.ok) throw new Error("server");
      setShowModal(true);
      setForm({ number: "", name: "", description: "", procedure: "", category: "", contactInfo: "" });
      setSearch("");
      setSelected(null);
    } catch {
      setSubmitError("Не удалось отправить заявку. Проверьте соединение и попробуйте снова.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoSubmit() {
    if (!photoFile || !photoForm.agreed) return;
    setLoading(true);
    setSubmitError("");
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string).split(",")[1]);
        reader.readAsDataURL(photoFile);
      });
      const res = await fetch(SEND_SUGGESTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "photo",
          number: photoForm.number,
          experience: photoForm.experience,
          photo_base64: base64,
          photo_name: photoFile.name,
          contact_info: photoForm.contactInfo,
        }),
      });
      if (!res.ok) throw new Error("server");
      setShowModal(true);
      setPhotoForm({ number: "", experience: "", agreed: false, contactInfo: "" });
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch {
      setSubmitError("Не удалось отправить фото. Проверьте соединение и попробуйте снова.");
    } finally {
      setLoading(false);
    }
  }

  const isValid = form.number.trim() && form.name.trim() && form.description.trim() && form.contactInfo.trim();
  const isPhotoValid = photoFile && photoForm.agreed && photoForm.contactInfo.trim();

  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Icon name="CheckCircle" size={32} className="text-green-600" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground text-center">Информация отправлена</h3>
            <p className="text-sm text-muted-foreground font-body text-center">Спасибо! Мы рассмотрим вашу заявку в ближайшее время.</p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      <h3 className="font-display text-xl font-bold text-foreground mb-1">Станьте частью справочника</h3>
      <p className="text-sm text-muted-foreground font-body mb-4">Добавьте короткий номер, предложите правку или поделитесь фото</p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {([
          { id: "add", icon: "Plus", label: "Новый номер", short: "Новый" },
          { id: "edit", icon: "Pencil", label: "Изменить описание", short: "Изменить" },
          { id: "photo", icon: "Camera", label: "Практика использования", short: "Фото" },
        ] as const).map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setSelected(null); setSearch(""); setForm({ number: "", name: "", description: "", procedure: "", category: "", contactInfo: "" }); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-body font-semibold transition-colors border ${
              mode === m.id ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary/40"
            }`}
          >
            <Icon name={m.icon} size={14} />
            <span className="hidden sm:inline">{m.label}</span>
            <span className="sm:hidden">{m.short}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
          {mode === "edit" && (
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelected(null); setForm({ number: "", name: "", description: "", procedure: "", category: "" }); }}
                placeholder="Найдите номер для редактирования..."
                className="w-full pl-9 pr-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 bg-white border border-border rounded-xl mt-1 shadow-lg overflow-hidden">
                  {suggestions.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => selectNumber(n)}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center gap-3"
                    >
                      <span className="font-display font-bold text-primary text-sm w-16 flex-shrink-0">{n.number}</span>
                      <span className="text-sm text-foreground font-body truncate">{n.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {(mode === "add" || selected) && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="Короткий номер *"
                  readOnly={mode === "edit" && !!selected}
                  className={`px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${mode === "edit" && selected ? "bg-muted text-muted-foreground" : ""}`}
                />
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Категория"
                  className="px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Название / назначение *"
                className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Описание *"
                className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
              <textarea
                rows={2}
                value={form.procedure}
                onChange={(e) => setForm({ ...form, procedure: e.target.value })}
                placeholder="Как воспользоваться (необязательно)"
                className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
              <input
                value={form.contactInfo}
                onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                placeholder="Имя, @telegram или e-mail для обратной связи *"
                className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              {submitError && (
                <p className="text-sm text-red-600 font-body flex items-center gap-1.5">
                  <Icon name="AlertCircle" size={14} />
                  {submitError}
                </p>
              )}
              <button
                onClick={handleSubmit}
                disabled={!isValid || loading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Icon name="Loader" size={16} className="animate-spin" />
                ) : (
                  <Icon name={mode === "add" ? "Plus" : "Pencil"} size={16} />
                )}
                {loading ? "Отправка..." : mode === "add" ? "Добавить номер" : "Отправить на проверку"}
              </button>
            </>
          )}

          {mode === "edit" && !selected && !suggestions.length && search.length > 0 && (
            <p className="text-center text-sm text-muted-foreground font-body py-4">Ничего не найдено — попробуйте другой запрос</p>
          )}

          {mode === "photo" && (
            <>
              <input
                value={photoForm.number}
                onChange={(e) => setPhotoForm({ ...photoForm, number: e.target.value })}
                placeholder="Короткий номер на фото (необязательно)"
                className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />

              <label className={`flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl cursor-pointer transition-colors ${photoPreview ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/40 bg-muted/30"}`}>
                {photoPreview ? (
                  <div className="relative w-full">
                    <img src={photoPreview} alt="preview" className="w-full max-h-52 object-contain rounded-xl p-1" />
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg font-body">
                      {photoFile?.name}
                    </div>
                  </div>
                ) : (
                  <div className="py-6 flex flex-col items-center gap-2">
                    <Icon name="ImagePlus" size={28} className="text-muted-foreground" />
                    <span className="text-sm font-body text-muted-foreground text-center px-4">Нажмите, чтобы выбрать фото<br /><span className="text-xs">JPG, PNG до 5 МБ</span></span>
                  </div>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSelect} />
              </label>

              <textarea
                rows={3}
                value={photoForm.experience}
                onChange={(e) => setPhotoForm({ ...photoForm, experience: e.target.value })}
                placeholder="Личный опыт или мысли (необязательно) — где встретили, как использовали, что думаете..."
                className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={photoForm.agreed}
                  onChange={(e) => setPhotoForm({ ...photoForm, agreed: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0"
                />
                <span className="text-xs font-body text-muted-foreground leading-relaxed">Я автор этих материалов и разрешаю их безвозмездно использовать на сайте, в новостном канале и в других материалах интернет-сервиса "2407.рф"</span>
              </label>

              <input
                value={photoForm.contactInfo}
                onChange={(e) => setPhotoForm({ ...photoForm, contactInfo: e.target.value })}
                placeholder="Имя, @telegram или e-mail для обратной связи *"
                className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              {submitError && (
                <p className="text-sm text-red-600 font-body flex items-center gap-1.5">
                  <Icon name="AlertCircle" size={14} />
                  {submitError}
                </p>
              )}
              <button
                onClick={handlePhotoSubmit}
                disabled={!isPhotoValid || loading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
                {loading ? "Отправка..." : "Отправить фото"}
              </button>
            </>
          )}
        </div>
    </div>
  );
}

export function HomeSection({ onNav }: { onNav: (s: string, category?: string) => void }) {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0376BB] to-[#025a90] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">

          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">Короткие номера и быстрые ответы</h1>
          <p className="text-white/80 font-body mb-8 max-w-2xl mx-auto text-lg">Экстренные службы, техподдержка операторов, социальные и коммерческие сервисы — найдите нужный номер или ответ за секунды</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNav("directory")}
              className="px-6 py-3 bg-white text-primary rounded-xl font-body font-semibold hover:bg-white/90 transition-colors flex items-center gap-2 justify-center"
            >
              <Icon name="Search" size={18} /> Справочник
            </button>
            <button
              onClick={() => onNav("nearby")}
              className="px-6 py-3 bg-white/15 text-white rounded-xl font-body font-semibold hover:bg-white/25 transition-colors flex items-center gap-2 justify-center border border-white/30"
            ><Icon name="Sparkles" size={18} /> Быстрый ответ (анонс)</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "Phone",       count: `${NUMBERS.length}`,  label: "Номера в базе" },
            { icon: "Wifi",        count: "4",                  label: "Операторы связи" },
            { icon: "ShieldCheck", count: "5",                  label: "Экстренные службы" },
            { icon: "RefreshCw",   count: LAST_UPDATED,         label: "Актуальность базы" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-border text-center hover-scale">
              {s.icon ? <Icon name={s.icon as IconName} size={19} className="text-primary mx-auto mb-1" /> : <span className="block text-primary font-body font-light leading-none mx-auto mb-1 text-xl">N</span>}
              <div className="font-display text-2xl font-bold text-foreground">{s.count}</div>
              <div className="text-xs text-muted-foreground font-body">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick access */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6">Быстрый доступ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "AlertTriangle", title: "Экстренные",          desc: "112, 101, 102, 103, 104",        section: "directory", category: "Экстренные",   color: "text-red-600",    bg: "bg-red-50" },
            { icon: "Headphones",    title: "Поддержка",            desc: "МТС, Билайн, МегаФон, Т2",       section: "operators",  category: undefined,       color: "text-blue-600",   bg: "bg-blue-50" },
            { icon: "Heart",         title: "Социальные",           desc: "Телефон доверия и помощь", section: "directory", category: "Социальные",   color: "text-purple-600", bg: "bg-purple-50" },
            { icon: "Building2",     title: "Коммерческие",         desc: "Сбер, ВТБ, Аэрофлот и другие",  section: "directory", category: "Коммерческие", color: "text-amber-600",  bg: "bg-amber-50" },
          ].map((item) => (
            <button
              key={item.title}
              onClick={() => onNav(item.section, item.category)}
              className="hover-scale bg-white border border-border rounded-xl p-5 text-left flex items-start gap-4 w-full"
            >
              <div className={`w-11 h-11 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon name={item.icon as IconName} size={22} className={item.color} />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Access banner */}
      <div className="max-w-6xl mx-auto px-4 pb-6">
        <PromoBanner section="home" />
      </div>

      {/* Add/Edit number form */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <NumberForm />
      </div>
    </div>
  );
}