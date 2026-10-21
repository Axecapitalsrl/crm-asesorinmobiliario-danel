(() => {
  const config = window.ELSITA_CONFIG || {};
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('nav');
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false');
  }));

  const photos = [...document.querySelectorAll('.gallery-photo img')].map(i => ({ src: i.src, alt: i.alt }));
  const lightbox = document.querySelector('#lightbox');
  const lightboxImg = lightbox.querySelector('img');
  const count = lightbox.querySelector('.lightbox-count');
  let active = 0;
  function showPhoto(index) {
    active = (index + photos.length) % photos.length;
    lightboxImg.src = photos[active].src;
    lightboxImg.alt = photos[active].alt;
    count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
  }
  document.querySelectorAll('.gallery-photo').forEach(button => button.addEventListener('click', () => {
    showPhoto(Number(button.dataset.index)); lightbox.classList.add('open'); document.body.style.overflow = 'hidden';
  }));
  function closePhoto() { lightbox.classList.remove('open'); document.body.style.overflow = ''; }
  lightbox.querySelector('.lightbox-close').addEventListener('click', closePhoto);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => showPhoto(active - 1));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => showPhoto(active + 1));
  document.querySelector('#gallery-prev').addEventListener('click', () => document.querySelector('.gallery-photo:nth-child(1)').scrollIntoView({ behavior: 'smooth', block: 'center' }));
  document.querySelector('#gallery-next').addEventListener('click', () => document.querySelector('.gallery-photo:nth-child(8)').scrollIntoView({ behavior: 'smooth', block: 'center' }));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closePhoto(); });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closePhoto();
    if (e.key === 'ArrowLeft') showPhoto(active - 1);
    if (e.key === 'ArrowRight') showPhoto(active + 1);
  });

  const form = document.querySelector('#lead-form');
  const status = document.querySelector('#form-status');
  const submit = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.textContent = '';
    status.className = 'form-status';
    if (!config.whatsappNumber || !config.crmEndpoint) {
      status.textContent = 'El contacto todavía no está configurado. Escribinos directamente por WhatsApp.';
      status.classList.add('error'); return;
    }
    const values = Object.fromEntries(new FormData(form).entries());
    const utm = new URLSearchParams(window.location.search);
    const payload = {
      name: String(values.name || '').trim(),
      phone: String(values.phone || '').trim(),
      email: String(values.email || '').trim() || null,
      lead_type: values.interest === 'Me interesa como inversión' ? 'investor' : 'buyer',
      source: 'website',
      property: 'Condominio Elsita',
      interest: values.interest,
      notes: `Consulta desde landing Condominio Elsita. Interés: ${values.interest}.`,
      consent: values.consent === 'on',
      company_website: String(values.company_website || ''),
      campaign: Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].filter(k => utm.has(k)).map(k => [k, utm.get(k)]))
    };
    submit.disabled = true;
    submit.querySelector('.submit-label').textContent = 'Enviando consulta…';
    try {
      const response = await fetch(config.crmEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(response.status === 404 ? 'El CRM todavía no tiene activa la recepción de consultas.' : 'No se pudo guardar tu consulta. Probá de nuevo en un momento.');
      const text = `Hola, soy ${payload.name}. Acabo de completar el formulario por la casa en Condominio Elsita. Mi WhatsApp es ${payload.phone}${payload.email ? ` y mi correo es ${payload.email}` : ''}. Me interesa: ${payload.interest}. ¿Podemos coordinar una visita?`;
      const url = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(text)}`;
      status.textContent = '¡Listo! Tu consulta quedó registrada. Abriendo WhatsApp…';
      status.classList.add('success');
      window.location.assign(url);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No se pudo guardar tu consulta. Probá de nuevo.';
      status.textContent = `${msg} Cuando esté integrado el CRM, vas a poder enviar el formulario desde aquí.`;
      status.classList.add('error');
      submit.disabled = false;
      submit.querySelector('.submit-label').textContent = 'Quiero coordinar una visita';
    }
  });
})();
