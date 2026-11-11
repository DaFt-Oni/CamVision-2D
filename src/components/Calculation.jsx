export default function Calculation({ number, title, formula, substitution, answer, children }) {
  return (
    <article className="calculation-step">
      <div className="calculation-title">
        <span>{number}</span>
        <h3>{title}</h3>
      </div>
      <dl>
        <div>
          <dt>Fórmula</dt>
          <dd>
            <code>{formula}</code>
          </dd>
        </div>
        <div>
          <dt>Sustitución</dt>
          <dd>
            <code>{substitution}</code>
          </dd>
        </div>
        <div className="calculation-answer">
          <dt>Resultado</dt>
          <dd>{answer}</dd>
        </div>
      </dl>
      <p className="calculation-meaning">{children}</p>
    </article>
  )
}
