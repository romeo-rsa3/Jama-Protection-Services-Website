/* ============================================================
   ADMIN.JS
   Auth + moderation. Every read/write here is still governed
   by the RLS policies in supabase/schema.sql — this file only
   works because the signed-in user's row in `admins` grants
   them elevated SELECT/UPDATE rights. Nothing here bypasses
   that; there is no separate "backdoor".
   ============================================================ */
(function(){
  var loginView = document.getElementById('loginView');
  var dashView  = document.getElementById('dashView');
  var loginForm = document.getElementById('loginForm');
  var loginError = document.getElementById('loginError');
  var whoami = document.getElementById('whoami');
  var signOutBtn = document.getElementById('signOutBtn');
  var tabs = document.querySelectorAll('.admin-tabs button');
  var modList = document.getElementById('modList');
  var pendingCount = document.getElementById('pendingCount');

  var currentTab = 'pending';

  function needsSetup(){
    return !window.supabaseClient;
  }

  function showError(text){
    loginError.textContent = text;
    loginError.style.display = 'block';
  }

  function esc(str){
    var d = document.createElement('div');
    d.textContent = str == null ? '' : str;
    return d.innerHTML;
  }

  function starsSvg(rating){
    var out = '';
    for(var i=1;i<=5;i++){
      out += '<svg class="'+(i<=rating?'':'empty')+'" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>';
    }
    return out;
  }

  async function refreshPendingCount(){
    try{
      var res = await window.supabaseClient
        .from('reviews')
        .select('id', { count:'exact', head:true })
        .eq('status', 'pending');
      pendingCount.textContent = (res.count || 0) + ' pending';
    }catch(e){ /* non-fatal */ }
  }

  async function loadTab(tab){
    currentTab = tab;
    modList.innerHTML = '<p class="empty-state">Loading…</p>';
    try{
      var res = await window.supabaseClient
        .from('reviews')
        .select('*')
        .eq('status', tab)
        .order('created_at', { ascending:false });

      if(res.error) throw res.error;
      renderList(res.data, tab);
    }catch(err){
      console.error(err);
      modList.innerHTML = '<p class="empty-state">Could not load reviews. You may need to be added to the `admins` table — see README.</p>';
    }
    refreshPendingCount();
  }

  function renderList(items, tab){
    if(!items || !items.length){
      modList.innerHTML = '<p class="empty-state">Nothing here yet.</p>';
      return;
    }
    var html = '';
    items.forEach(function(r){
      html += '<div class="mod-card" data-id="' + r.id + '">' +
        '<div>' +
          '<div class="stars">' + starsSvg(r.rating) + '</div>' +
          '<p class="msg">"' + esc(r.message) + '"</p>' +
          '<div class="who">' + esc(r.name) + (r.role ? ' — ' + esc(r.role) : '') + ' · ' + new Date(r.created_at).toLocaleDateString() + '</div>' +
        '</div>' +
        '<div class="mod-actions">' + actionsFor(tab) + '</div>' +
      '</div>';
    });
    modList.innerHTML = html;

    modList.querySelectorAll('[data-action]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var card = btn.closest('.mod-card');
        var id = card.dataset.id;
        var action = btn.dataset.action;
        setStatus(id, action, card);
      });
    });
  }

  function actionsFor(tab){
    if(tab === 'pending'){
      return '<button class="btn-approve" data-action="approved">Approve</button>' +
             '<button class="btn-reject" data-action="rejected">Reject</button>';
    }
    if(tab === 'approved'){
      return '<button class="btn-unpublish" data-action="pending">Unpublish</button>';
    }
    return '<button class="btn-approve" data-action="approved">Approve</button>';
  }

  async function setStatus(id, newStatus, cardEl){
    cardEl.style.opacity = '.4';
    try{
      var res = await window.supabaseClient
        .from('reviews')
        .update({ status: newStatus })
        .eq('id', id);
      if(res.error) throw res.error;
      cardEl.remove();
      refreshPendingCount();
    }catch(err){
      console.error(err);
      cardEl.style.opacity = '1';
      alert('Could not update this review. Check your admin permissions.');
    }
  }

  tabs.forEach(function(btn){
    btn.addEventListener('click', function(){
      tabs.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      loadTab(btn.dataset.tab);
    });
  });

  /* ---------- auth ---------- */
  function showDashboard(user){
    loginView.style.display = 'none';
    dashView.style.display = 'block';
    whoami.textContent = user.email;
    loadTab('pending');
  }

  function showLogin(){
    dashView.style.display = 'none';
    loginView.style.display = 'flex';
  }

  loginForm.addEventListener('submit', async function(e){
    e.preventDefault();
    loginError.style.display = 'none';

    if(needsSetup()){
      showError('Supabase is not configured yet. Add your project URL and anon key to js/supabase-config.js — see README.md.');
      return;
    }

    var email = document.getElementById('lEmail').value.trim();
    var password = document.getElementById('lPass').value;
    var btn = loginForm.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Signing in…';

    try{
      var res = await window.supabaseClient.auth.signInWithPassword({ email:email, password:password });
      if(res.error) throw res.error;
      showDashboard(res.data.user);
    }catch(err){
      showError(err.message || 'Sign in failed.');
    }finally{
      btn.disabled = false; btn.textContent = 'Sign In';
    }
  });

  signOutBtn.addEventListener('click', async function(){
    try{ await window.supabaseClient.auth.signOut(); }catch(e){}
    showLogin();
  });

  /* ---------- restore session on load ---------- */
  window.addEventListener('load', async function(){
    if(needsSetup()) return;
    try{
      var res = await window.supabaseClient.auth.getSession();
      if(res.data.session && res.data.session.user){
        showDashboard(res.data.session.user);
      }
    }catch(e){ /* stay on login */ }
  });
})();
