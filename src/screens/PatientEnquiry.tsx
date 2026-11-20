import { useState } from 'react';
import { ArrowRight, Bot, CheckCircle2, Clock, Info, Phone, ShieldCheck, UserRound } from 'lucide-react';
import Logo from '../components/Logo';
import { STRINGS } from '../i18n/patientStrings';
import type { CallPreference, Language } from '../data/types';
import { CLINIC_PHONE, CLOSE_HOUR, OPEN_HOUR } from '../data/constants';
import { DEMO_PATIENT, useLeads } from '../store/LeadsContext';

export default function PatientEnquiry() {
  const { dispatch } = useLeads();
  const [lang, setLang] = useState<Language>('English');
  const [pref, setPref] = useState<CallPreference | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState<CallPreference | null>(null);

  const t = STRINGS[lang];
  const hour = new Date().getHours();
  const clinicOpen = hour >= OPEN_HOUR && hour < CLOSE_HOUR;
  const canSubmit = pref === 'human' || (pref === 'ai' && consent);

  const changeLang = (l: Language) => {
    setLang(l);
    if (submitted) dispatch({ type: 'setLanguage', language: l });
  };

  const submit = (p: CallPreference) => {
    dispatch({ type: 'submitEnquiry', language: lang, preference: p });
    setPref(p);
    setSubmitted(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const choose = (p: CallPreference) => {
    setPref(p);
    if (p === 'human') setConsent(false);
  };

  return (
    <div className="patient-page" lang={lang === 'Hindi' ? 'hi' : 'en'}>
      <main className="phone">
        <header className="phone__header">
          <Logo />
          {submitted && <div className="seg" role="radiogroup" aria-label={t.langTitle}>
            {(['English', 'Hindi'] as Language[]).map((l) => (
              <button key={l} role="radio" aria-checked={lang === l} className={lang === l ? 'on' : ''} onClick={() => changeLang(l)}>
                {l === 'English' ? 'English' : 'हिंदी'}
              </button>
            ))}
          </div>}
          {!submitted && <span className="phone__tag">{t.clinicTag}</span>}
        </header>

        {!submitted ? (
          <>
            <section className="hero">
              <div className="hero__icon"><CheckCircle2 size={22} /></div>
              <div>
                <h1>{t.receivedTitle}</h1>
                <p>{t.receivedBody}</p>
              </div>
            </section>

            <section className="card summary">
              <dl>
                <div><dt>{t.treatmentLabel}</dt><dd className="strong">{t.treatment}</dd></div>
                <div><dt>{t.clinicLabel}</dt><dd>{t.clinic}</dd></div>
                <div><dt>{t.phoneLabel}</dt><dd>{DEMO_PATIENT.phone}</dd></div>
                <div><dt>{t.ref}</dt><dd className="mono">{DEMO_PATIENT.ref}</dd></div>
              </dl>
            </section>

            <section className="block">
              <h2>{t.langTitle}</h2>
              <div className="lang-choice" role="radiogroup" aria-label={t.langTitle}>
                {(['English', 'Hindi'] as Language[]).map((l) => (
                  <label key={l} className={`lang-opt ${lang === l ? 'on' : ''}`}>
                    <input type="radio" name="lang" checked={lang === l} onChange={() => changeLang(l)} />
                    <span>{l === 'English' ? 'English' : 'हिंदी (Hindi)'}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="block">
              <h2>{t.callbackTitle}</h2>

              <div className="disclosure">
                <div className="disclosure__title"><Info size={16} /> {t.disclosureTitle}</div>
                <ul>
                  {t.disclosure.map((d) => <li key={d}>{d}</li>)}
                </ul>
              </div>

              <div className="options" role="radiogroup" aria-label={t.callbackTitle}>
                <label className={`option ${pref === 'ai' ? 'on' : ''}`}>
                  <input type="radio" name="pref" checked={pref === 'ai'} onChange={() => choose('ai')} />
                  <span className="option__icon"><Bot size={20} /></span>
                  <span className="option__body">
                    <span className="option__title">{t.aiTitle}</span>
                    <span className="pill pill--teal"><Clock size={12} /> {t.aiBadge}</span>
                    <span className="option__desc">{t.aiDesc}</span>
                  </span>
                </label>

                {pref === 'ai' && (
                  <label className="consent">
                    <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                    <span>{t.consent(DEMO_PATIENT.phone)}</span>
                  </label>
                )}

                <label className={`option ${pref === 'human' ? 'on' : ''}`}>
                  <input type="radio" name="pref" checked={pref === 'human'} onChange={() => choose('human')} />
                  <span className="option__icon option__icon--blue"><UserRound size={20} /></span>
                  <span className="option__body">
                    <span className="option__title">{t.humanTitle}</span>
                    <span className="pill pill--blue"><Clock size={12} /> {t.humanBadge}</span>
                    <span className="option__desc">{t.humanDesc}</span>
                  </span>
                </label>
              </div>
            </section>

            <div className="submit-area">
              {!canSubmit && <p className="hint">{pref === 'ai' ? t.needConsent : t.needChoice}</p>}
              <button className="btn btn--primary btn--block btn--lg" disabled={!canSubmit} onClick={() => pref && submit(pref)}>
                {pref === 'human' ? t.submitHuman : t.submitAi}
              </button>
              <p className="fine"><ShieldCheck size={14} /> {t.privacy}</p>
            </div>
          </>
        ) : (
          <section className="done">
            <div className="done__icon"><CheckCircle2 size={36} /></div>
            <h1>{submitted === 'ai' ? t.doneAiTitle : t.doneHumanTitle}</h1>
            <p className="done__body">
              {submitted === 'ai' ? t.doneAiBody(t.langName[lang]) : t.doneHumanBody(t.langName[lang])}
            </p>
            {!clinicOpen && <p className="note"><Clock size={14} /> {t.closedNote}</p>}

            <div className="card summary summary--compact">
              <dl>
                <div><dt>{t.treatmentLabel}</dt><dd className="strong">{t.treatment}</dd></div>
                <div><dt>{t.ref}</dt><dd className="mono">{DEMO_PATIENT.ref}</dd></div>
              </dl>
            </div>

            <div className="card steps">
              <h2>{t.nextTitle}</h2>
              <ol>
                {(submitted === 'ai' ? t.nextAi(CLINIC_PHONE) : t.nextHuman(CLINIC_PHONE)).map((s, i) => (
                  <li key={s}><span className="steps__n">{i + 1}</span><span>{s}</span></li>
                ))}
              </ol>
              <p className="fine"><Phone size={14} /> {submitted === 'ai' ? t.optOut : t.privacy}</p>
            </div>

            <div className="done__actions">
              {submitted === 'ai' && (
                <button className="btn btn--secondary btn--block" onClick={() => submit('human')}>
                  <UserRound size={16} /> {t.switchHuman}
                </button>
              )}
              <button className="btn btn--ghost btn--block" onClick={() => { setSubmitted(null); setConsent(false); }}>
                {t.changePref}
              </button>
            </div>

            <a className="staff-link" href="#/dashboard">
              <span className="staff-link__tag">Prototype</span> {t.staffLink} <ArrowRight size={14} />
            </a>
          </section>
        )}
      </main>
    </div>
  );
}
