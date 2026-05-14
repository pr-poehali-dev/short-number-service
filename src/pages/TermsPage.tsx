import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { LEGAL_DATES } from "@/config/legalDates";

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h1 className="font-semibold text-foreground">Пользовательское соглашение</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 prose prose-sm text-foreground">
        <p className="text-muted-foreground text-sm mb-8">Последнее обновление: {LEGAL_DATES.terms}</p>

        <h2 className="text-base font-semibold mt-6 mb-2">1. Общие положения</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует условия использования
          интернет-сервиса «Справочник коротких номеров России "2407"», доступного по адресам
          короткий-номер.рф и 2407.рф (далее — «Сервис»), предоставляемого ООО «МЕДИА-ИНКОД»
          (далее — «Оператор»).
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          Использование Сервиса означает полное и безоговорочное принятие условий настоящего Соглашения.
          Если вы не согласны с условиями Соглашения, пожалуйста, прекратите использование Сервиса.
        </p>

        <h2 className="text-base font-semibold mt-6 mb-2">2. Описание Сервиса</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Сервис предоставляет пользователям доступ к справочной информации о коротких телефонных
          номерах, действующих на территории Российской Федерации. Вся информация носит исключительно
          справочный характер и не является официальным источником данных операторов связи.
        </p>

        <h2 className="text-base font-semibold mt-6 mb-2">3. Условия использования</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">Пользователь обязуется:</p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-2 space-y-1">
          <li>использовать Сервис только в законных целях;</li>
          <li>не предпринимать действий, нарушающих работу Сервиса;</li>
          <li>не копировать, не воспроизводить и не распространять содержимое Сервиса без письменного согласия Оператора;</li>
          <li>не использовать автоматизированные средства для сбора данных с Сервиса (парсинг, скрапинг).</li>
        </ul>

        <h2 className="text-base font-semibold mt-6 mb-2">4. Интеллектуальная собственность</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Все материалы Сервиса, включая структуру базы данных, дизайн и программный код, являются
          интеллектуальной собственностью ООО «МЕДИА-ИНКОД» и защищены законодательством Российской
          Федерации об авторских правах.
        </p>

        <h2 className="text-base font-semibold mt-6 mb-2">5. Ограничение ответственности</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Оператор прилагает все усилия для обеспечения актуальности и достоверности информации,
          размещённой в Сервисе, однако не гарантирует её полноту и точность. Оператор не несёт
          ответственности за любой ущерб, прямой или косвенный, возникший вследствие использования
          или невозможности использования Сервиса.
        </p>

        <h2 className="text-base font-semibold mt-6 mb-2">6. Изменение условий</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Оператор вправе в одностороннем порядке изменять условия настоящего Соглашения.
          Новая редакция вступает в силу с момента её публикации на сайте. Продолжение использования
          Сервиса после публикации изменений означает согласие с новыми условиями.
        </p>

        <h2 className="text-base font-semibold mt-6 mb-2">7. Применимое право</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Настоящее Соглашение регулируется и толкуется в соответствии с законодательством
          Российской Федерации. Все споры разрешаются в судебном порядке по месту нахождения Оператора.
        </p>

        <h2 className="text-base font-semibold mt-6 mb-2">8. Контактная информация</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ООО «МЕДИА-ИНКОД»<br />
          Служба поддержки: <a href="mailto:support@incode.ru" className="text-blue-600 hover:underline">support@incode.ru</a>
        </p>
      </main>

      <footer className="border-t border-border bg-white py-6 px-4 mt-8">
        <div className="max-w-3xl mx-auto text-sm text-muted-foreground text-center">
          © ООО «МЕДИА-ИНКОД», 2026
        </div>
      </footer>
    </div>
  );
}