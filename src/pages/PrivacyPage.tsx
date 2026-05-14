import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { LEGAL_DATES } from "@/config/legalDates";

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h1 className="font-semibold text-foreground">Политика конфиденциальности</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 prose prose-sm text-foreground">
        <p className="text-muted-foreground text-sm mb-8">Последнее обновление: {LEGAL_DATES.privacy}</p>

        <h2 className="text-base font-semibold mt-6 mb-2">1. Общие положения</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Настоящая Политика конфиденциальности (далее — «Политика») описывает порядок обработки
          информации, получаемой ООО «МЕДИА-ИНКОД» (далее — «Оператор») при использовании
          интернет-сервиса «Справочник коротких номеров России "2407"» (короткий-номер.рф, 2407.рф).
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          Оператор обрабатывает персональные данные в соответствии с Федеральным законом от 27.07.2006
          № 152-ФЗ «О персональных данных».
        </p>

        <h2 className="text-base font-semibold mt-6 mb-2">2. Какие данные мы собираем</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">Сервис может собирать следующие данные:</p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-2 space-y-1">
          <li>технические данные: IP-адрес, тип браузера, операционная система, страницы посещений;</li>
          <li>данные, которые пользователь добровольно предоставляет при обращении в службу поддержки (имя, адрес электронной почты);</li>
          <li>файлы cookie — небольшие текстовые файлы, сохраняемые браузером для корректной работы Сервиса.</li>
        </ul>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          Сервис не требует регистрации и не собирает персональные данные пользователей в процессе
          обычного использования справочника.
        </p>

        <h2 className="text-base font-semibold mt-6 mb-2">3. Цели обработки данных</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">Собранные данные используются для:</p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-2 space-y-1">
          <li>обеспечения корректной работы Сервиса;</li>
          <li>анализа статистики посещаемости и улучшения качества Сервиса;</li>
          <li>ответа на обращения пользователей в службу поддержки.</li>
        </ul>

        <h2 className="text-base font-semibold mt-6 mb-2">4. Хранение и защита данных</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Оператор принимает технические и организационные меры для защиты данных от
          несанкционированного доступа, изменения, раскрытия или уничтожения. Данные хранятся
          на серверах, расположенных на территории Российской Федерации.
        </p>

        <h2 className="text-base font-semibold mt-6 mb-2">5. Передача данных третьим лицам</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Оператор не продаёт и не передаёт персональные данные пользователей третьим лицам,
          за исключением случаев, предусмотренных законодательством Российской Федерации.
        </p>

        <h2 className="text-base font-semibold mt-6 mb-2">6. Файлы cookie</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Сервис использует файлы cookie для обеспечения корректной работы. Пользователь вправе
          отключить cookie в настройках браузера, однако это может повлиять на работу отдельных
          функций Сервиса.
        </p>

        <h2 className="text-base font-semibold mt-6 mb-2">7. Права пользователей</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">Пользователь вправе:</p>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-5 mt-2 space-y-1">
          <li>запросить информацию об обрабатываемых персональных данных;</li>
          <li>потребовать исправления или удаления своих персональных данных;</li>
          <li>отозвать согласие на обработку персональных данных.</li>
        </ul>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          Для реализации прав направьте запрос на адрес:{" "}
          <a href="mailto:support@incode.ru" className="text-blue-600 hover:underline">support@incode.ru</a>.
        </p>

        <h2 className="text-base font-semibold mt-6 mb-2">8. Изменение Политики</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Оператор вправе изменять настоящую Политику. Актуальная версия всегда доступна
          на странице короткий-номер.рф/privacy. Продолжение использования Сервиса после
          публикации изменений означает согласие с новой редакцией Политики.
        </p>

        <h2 className="text-base font-semibold mt-6 mb-2">9. Контактная информация</h2>
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