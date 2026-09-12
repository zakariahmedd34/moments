import type { InputHTMLAttributes, ReactNode } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  id: string
  label: string
  hint?: string
  leading?: string
  trailing?: ReactNode
}

export function TextField({ id, label, hint, leading, trailing, className, ...inputProps }: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const classes = ['text-field', leading && 'text-field--leading', trailing && 'text-field--trailing', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <div className="text-field__box">
        <input id={id} className="text-field__input" placeholder=" " aria-describedby={hintId} {...inputProps} />
        <label htmlFor={id} className="text-field__label">
          {label}
        </label>
        {leading && (
          <span className="text-field__leading" aria-hidden="true">
            {leading}
          </span>
        )}
        {trailing && <span className="text-field__trailing">{trailing}</span>}
      </div>
      {hint && (
        <p id={hintId} className="text-field__hint">
          {hint}
        </p>
      )}
    </div>
  )
}
