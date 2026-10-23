document.querySelectorAll('.showcase-filters').forEach(group=>{
  const buttons=[...group.querySelectorAll('[data-filter]')];
  const cards=[...document.querySelectorAll('.showcase-card[data-kind]')];
  const sections=[...document.querySelectorAll('[data-showcase-group]')];
  group.addEventListener('click',event=>{
    const button=event.target.closest('[data-filter]');
    if(!button)return;
    const filter=button.dataset.filter;
    buttons.forEach(item=>{
      const active=item===button;
      item.classList.toggle('is-active',active);
      item.setAttribute('aria-pressed',String(active));
    });
    cards.forEach(card=>{card.hidden=filter!=='all'&&card.dataset.kind!==filter});
    sections.forEach(section=>{section.hidden=filter!=='all'&&section.dataset.showcaseGroup!==filter});
  });
});
