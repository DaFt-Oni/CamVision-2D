export function navigateTabs(event, values, current, onChange) {
  const index = values.indexOf(current)
  const next =
    event.key === 'ArrowRight'
      ? values[(index + 1) % values.length]
      : event.key === 'ArrowLeft'
        ? values[(index - 1 + values.length) % values.length]
        : event.key === 'Home'
          ? values[0]
          : event.key === 'End'
            ? values.at(-1)
            : null
  if (!next) return
  event.preventDefault()
  onChange(next)
  const tabs = event.currentTarget.parentElement.querySelectorAll('[role="tab"]')
  tabs[values.indexOf(next)]?.focus()
}
