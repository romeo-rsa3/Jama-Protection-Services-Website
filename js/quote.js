/* ============================================================
   QUOTE.JS — Request Quote form -> Formspree (email to business)
   ============================================================ */
(function(){
  var form = document.getElementById('quoteForm');
  var msgEl = document.getElementById('quoteMsg');
  if(!form) return;

  function showMsg(text, ok){
    msgEl.textContent = text;
    msgEl.className = 'form-msg show ' + (ok ? 'ok' : 'err');
  }

  form.addEventListener('submit', async function(e){
    e.preventDefault();

    if(typeof FORMSPREE_ENDPOINT === 'undefined' || FORMSPREE_ENDPOINT.indexOf('YOUR-FORM-ID') !== -1){
      showMsg('This form is not connected yet — the site owner needs to add their Formspree endpoint (see README). In the meantime, please call 064 516 1935.', false);
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    var data = new FormData(form);
    data.append('_subject', 'New quote request — JAMA Protection Services website');

    try{
      var res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if(res.ok){
        showMsg('Thank you — your request has been sent. We\'ll be in touch by email or phone shortly.', true);
        form.reset();
      } else {
        var payload = await res.json().catch(function(){ return null; });
        var detail = payload && payload.errors ? payload.errors.map(function(x){ return x.message; }).join(', ') : '';
        showMsg('Could not send your request' + (detail ? ' (' + detail + ')' : '') + '. Please call us on 064 516 1935.', false);
      }
    }catch(err){
      console.error(err);
      showMsg('Network error sending your request. Please call us on 064 516 1935.', false);
    }finally{
      btn.disabled = false;
      btn.textContent = original;
    }
  });
})();
