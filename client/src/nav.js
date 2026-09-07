function renderNav() {
  const nav = document.getElementById('auth-nav')
  if (!nav) return
  const auth = getAuth()
  if (auth) {
    const name = auth.user.name || auth.user.username || auth.user.email || 'User'
    nav.innerHTML = '<span class="nav-user">' + name + '</span>' +
      ' <a href="dashboard.html" class="nav-link">Dashboard</a>' +
      (auth.user.role === 'admin' ? ' <a href="admin.html" class="nav-link">Admin</a>' : '') +
      ' <a href="#" class="nav-link" id="logout-btn">Logout</a>'
    document.getElementById('logout-btn')?.addEventListener('click', (e) => { e.preventDefault(); clearAuth(); location.href='index.html' })
  } else {
    nav.innerHTML = '<a href="login.html" class="nav-link">Login</a>'
  }
}
renderNav()
