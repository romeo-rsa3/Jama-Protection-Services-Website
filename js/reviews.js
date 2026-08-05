/* ============================================================
   REVIEWS.JS
   - Loads approved reviews from Supabase (public, read-only)
   - Submits new reviews as status = 'pending' (public, insert-only)
   Both permissions are enforced server-side by RLS policies —
   see supabase/schema.sql. A visitor can never read pending
   reviews or write directly to "approved".
   ============================================================ */
(function(){
  var listEl = document.getElementById('reviews-list');
  var form   = document.getElementById('reviewForm');
  var msgEl  = document.getElementById('reviewMsg');

  var DEMO_REVIEWS = [
    { name:'Nomvula K.', role:'Body Corporate Trustee, Umhlanga', rating:5, message:'Jama took over guarding for our estate and the difference was immediate — guards on time, proper reporting, and the control room actually answers.' },
    { name:'Craig P.', role:'Facilities Manager', rating:5, message:'We use them for CCTV monitoring and armed response. Professional from the site assessment through to installation.' },
    { name:'Thandeka M.', role:'Event Organiser', rating:4, message:'Booked JAMA for VIP and crowd control at a conference — well briefed, sharp looking, no issues all day.' }
  ];

  function starsSvg(rating){
    var out = '';
    for(var i=1;i<=5;i++){
      out += '<svg class="'+(i<=rating?'':'empty')+'" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>';
    }
    return out;
  }

  function esc(str){
    var d = document.createElement('div');
    d.textContent = str == null ? '' : str;
    return d.innerHTML;
  }

  function renderReviews(items, isDemo){
    if(!items || !items.length){
      listEl.innerHTML = '<p class="reviews-empty">No reviews yet — be the first to leave one.</p>';
      return;
    }
    var html = '';
    if(isDemo){
      html += '<p class="reviews-empty" style="margin-bottom:18px;">Showing sample reviews — connect Supabase to display live, approved client reviews here.</p>';
    }
    items.forEach(function(r){
      html += '' +
        '<div class="review-card">' +
          '<div class="stars">' + starsSvg(r.rating) + '</div>' +
          '<p class="msg">"' + esc(r.message) + '"</p>' +
          '<div class="who">' + esc(r.name) + (r.role ? ' — ' + esc(r.role) : '') + '</div>' +
        '</div>';
    });
    listEl.innerHTML = html;
  }

  async function loadReviews(){
    if(!window.supabaseClient){
      renderReviews(DEMO_REVIEWS, true);
      return;
    }
    try{
      var res = await window.supabaseClient
        .from('reviews')
        .select('name, role, rating, message, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending:false })
        .limit(20);

      if(res.error) throw res.error;
      renderReviews(res.data, false);
    }catch(err){
      console.error('Could not load reviews:', err);
      listEl.innerHTML = '<p class="reviews-empty">Reviews are temporarily unavailable. Please check back shortly.</p>';
    }
  }

  function showMsg(el, text, ok){
    el.textContent = text;
    el.className = 'form-msg show ' + (ok ? 'ok' : 'err');
  }

  if(form){
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var rating = parseInt(document.getElementById('rvRating').value, 10);
      var name = document.getElementById('rvName').value.trim();
      var role = document.getElementById('rvRole').value.trim();
      var message = document.getElementById('rvMsg').value.trim();

      if(!rating){
        showMsg(msgEl, 'Please select a star rating.', false);
        return;
      }
      if(!name || !message){
        showMsg(msgEl, 'Please fill in your name and review.', false);
        return;
      }

      if(!window.supabaseClient){
        showMsg(msgEl, 'Review form is not connected yet — the site owner needs to add their Supabase keys (see README).', false);
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Submitting…';

      try{
        var res = await window.supabaseClient.from('reviews').insert([{
          name: name,
          role: role || null,
          rating: rating,
          message: message,
          status: 'pending'
        }]);
        if(res.error) throw res.error;

        showMsg(msgEl, 'Thank you — your review has been submitted and will appear once approved.', true);
        form.reset();
        document.querySelectorAll('#starPicker svg').forEach(function(s){ s.classList.remove('on'); });
        document.getElementById('rvRating').value = 0;
      }catch(err){
        console.error(err);
        showMsg(msgEl, 'Something went wrong submitting your review. Please try again or call us directly.', false);
      }finally{
        btn.disabled = false;
        btn.textContent = 'Submit Review';
      }
    });
  }

  loadReviews();
})();
