// ──────────────────────────────────────────────
// THEME TOGGLE — Dark / Light Mode
// ──────────────────────────────────────────────
(function () {
    const saved = localStorage.getItem('ml-theme')
    if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light')
})()

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeToggle')
    if (!btn) return
    btn.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light'
        const next = isLight ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', next)
        localStorage.setItem('ml-theme', next)
    })
})

// ──────────────────────────────────────────────
// CONNEXION SUPABASE
// ──────────────────────────────────────────────
const { createClient } = supabase
const client = createClient(
  'https://uyuferkxictqmamfuoll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dWZlcmt4aWN0cW1hbWZ1b2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzgwNjYsImV4cCI6MjA4Nzk1NDA2Nn0.j5WjyJaV_xxgcsREDu5kzUyGAaeXQ2rckNuxI53XNKc'
)

// ──────────────────────────────────────────────
// VARIABLES GLOBALES
// ──────────────────────────────────────────────
let currentUser = null
let cart = []
let deliveryFee = 0
let paymentMethod = ''

// Vérifie session au chargement
client.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        currentUser = session.user
        updateNavForLoggedUser()
    }
})

client.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null
    updateNavForLoggedUser()
})

function updateNavForLoggedUser() {
    const loginBtn = document.querySelector('.login-btn')
    if (!loginBtn) return
    loginBtn.textContent = currentUser ? 'Mon compte' : 'Connexion'
}

// ──────────────────────────────────────────────
// TOAST NOTIFICATION (remplace les alert)
// ──────────────────────────────────────────────
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast')
    if (!toast) return
    toast.textContent = message
    toast.classList.add('show')
    clearTimeout(toast._timer)
    toast._timer = setTimeout(() => toast.classList.remove('show'), duration)
}

// ──────────────────────────────────────────────
// MODAL CONNEXION
// ──────────────────────────────────────────────
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block'
    document.body.style.overflow = 'hidden'
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none'
    document.body.style.overflow = ''
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none'
    document.getElementById('registerForm').style.display = 'block'
}

function showLogin() {
    document.getElementById('registerForm').style.display = 'none'
    document.getElementById('loginForm').style.display = 'block'
}

// ──────────────────────────────────────────────
// CONNEXION (LOGIN)
// ──────────────────────────────────────────────
async function handleLogin(event) {
    event.preventDefault()
    const email    = document.getElementById('loginEmail').value
    const password = document.getElementById('loginPassword').value

    const { data, error } = await client.auth.signInWithPassword({ email, password })

    if (error) {
        showToast('❌ Email ou mot de passe incorrect.')
        return
    }

    currentUser = data.user
    showToast('✨ Bienvenue ! Connexion réussie.')
    closeLoginModal()
    document.getElementById('loginEmail').value = ''
    document.getElementById('loginPassword').value = ''
}

// ──────────────────────────────────────────────
// INSCRIPTION (REGISTER)
// ──────────────────────────────────────────────
async function handleRegister(event) {
    event.preventDefault()
    const name     = document.getElementById('registerName').value
    const email    = document.getElementById('registerEmail').value
    const phone    = document.getElementById('registerPhone').value
    const password = document.getElementById('registerPassword').value

    const { data, error } = await client.auth.signUp({ email, password })

    if (error) {
        const msg = error.message.toLowerCase().includes('already')
            ? '⚠️ Un compte existe déjà avec cet email !'
            : 'Erreur : ' + error.message
        showToast(msg)
        return
    }

    const { error: profileError } = await client.from('profils').insert([{
        id: data.user.id,
        nom: name,
        telephone: phone
    }])

    if (profileError) console.error('Erreur profil :', profileError.message)

    showToast('✅ Inscription réussie ! Connectez-vous.')
    showLogin()

    document.getElementById('registerName').value = ''
    document.getElementById('registerEmail').value = ''
    document.getElementById('registerPhone').value = ''
    document.getElementById('registerPassword').value = ''
}

// ──────────────────────────────────────────────
// PANIER
// ──────────────────────────────────────────────
function addToCart(name, price) {
    const existing = cart.find(item => item.name === name)
    if (existing) {
        existing.quantity++
    } else {
        cart.push({ name, price, quantity: 1 })
    }
    updateCartCount()
    showToast('🛒 ' + name + ' ajouté au panier !')
}

function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0)
    document.getElementById('cartCount').textContent = total
}

function openCartModal() {
    document.getElementById('cartModal').style.display = 'block'
    document.body.style.overflow = 'hidden'
    displayCart()
}

function closeCartModal() {
    document.getElementById('cartModal').style.display = 'none'
    document.body.style.overflow = ''
}

function displayCart() {
    const cartContent = document.getElementById('cartContent')

    if (cart.length === 0) {
        cartContent.innerHTML = `
            <div class="empty-cart">
                <span class="empty-cart-icon">🛒</span>
                <h3 style="font-family:'Cormorant Garamond',serif; font-size:24px; color:var(--gold); margin-bottom:10px;">Panier vide</h3>
                <p>Ajoutez des fragrances pour commencer</p>
            </div>`
        document.getElementById('checkoutSection').style.display = 'none'
        return
    }

    let html = '<div class="cart-items">'
    cart.forEach((item, i) => {
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.price.toLocaleString()} FCFA × ${item.quantity} = <strong>${(item.price * item.quantity).toLocaleString()} FCFA</strong></p>
                </div>
                <div class="cart-item-actions">
                    <button class="qty-btn" onclick="decreaseQty(${i})">−</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="increaseQty(${i})">+</button>
                    <button class="remove-btn" onclick="removeFromCart(${i})">🗑️</button>
                </div>
            </div>`
    })
    html += '</div>'

    const subtotal = cart.reduce((s, item) => s + item.price * item.quantity, 0)
    html += `
        <div class="order-summary">
            <div class="summary-row">
                <span>Sous-total</span>
                <span>${subtotal.toLocaleString()} FCFA</span>
            </div>
            <div class="summary-row">
                <span>Articles</span>
                <span>${cart.reduce((s, item) => s + item.quantity, 0)}</span>
            </div>
        </div>`

    cartContent.innerHTML = html
    document.getElementById('checkoutSection').style.display = 'block'
    updateOrderSummary()
}

function increaseQty(index) {
    cart[index].quantity++
    displayCart()
    updateCartCount()
}

function decreaseQty(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity--
        displayCart()
        updateCartCount()
    }
}

function removeFromCart(index) {
    cart.splice(index, 1)
    displayCart()
    updateCartCount()
}

function selectDelivery(type, fee) {
    deliveryFee = fee
    document.querySelectorAll('.delivery-option').forEach(opt => {
        if (opt.querySelector('input[name="delivery"]')) opt.classList.remove('selected')
    })
    event.currentTarget.classList.add('selected')
    const radio = document.querySelector(`input[name="delivery"][value="${type}"]`)
    if (radio) radio.checked = true
    updateOrderSummary()
}

function selectPayment(method) {
    paymentMethod = method
    document.querySelectorAll('.delivery-option').forEach(opt => {
        if (opt.querySelector('input[name="payment"]')) opt.classList.remove('selected')
    })
    event.currentTarget.classList.add('selected')
    const radio = document.querySelector(`input[name="payment"][value="${method}"]`)
    if (radio) radio.checked = true
}

function updateOrderSummary() {
    const subtotal = cart.reduce((s, item) => s + item.price * item.quantity, 0)
    const total    = subtotal + deliveryFee
    document.getElementById('summarySubtotal').textContent = subtotal.toLocaleString() + ' FCFA'
    document.getElementById('summaryDelivery').textContent = deliveryFee.toLocaleString() + ' FCFA'
    document.getElementById('summaryTotal').textContent    = total.toLocaleString() + ' FCFA'
}

function confirmOrder(event) {
    event.preventDefault()
    const name    = document.getElementById('customerName').value
    const phone   = document.getElementById('customerPhone').value
    const address = document.getElementById('customerAddress').value
    const city    = document.getElementById('customerCity').value

    if (!deliveryFee) {
        showToast('⚠️ Veuillez sélectionner un mode de livraison !')
        return
    }
    if (!paymentMethod) {
        showToast('⚠️ Veuillez sélectionner un mode de paiement !')
        return
    }

    const subtotal = cart.reduce((s, item) => s + item.price * item.quantity, 0)
    const total    = subtotal + deliveryFee

    const payLabels = { wave: '💙 Wave', om: '🟠 Orange Money', card: '💳 Carte Bancaire', cash: '💵 Paiement à la livraison' }

    let msg = `🛍️ *NOUVELLE COMMANDE MATA LUXURY*\n\n`
    msg += `👤 *Client:* ${name}\n`
    msg += `📱 *Téléphone:* ${phone}\n`
    msg += `📍 *Adresse:* ${address}, ${city}\n`
    msg += `💰 *Paiement:* ${payLabels[paymentMethod] || paymentMethod}\n\n`
    msg += `🎁 *Commande:*\n`
    cart.forEach(item => {
        msg += `• ${item.name} ×${item.quantity} = ${(item.price * item.quantity).toLocaleString()} FCFA\n`
    })
    msg += `\n💰 *Sous-total:* ${subtotal.toLocaleString()} FCFA\n`
    msg += `🚚 *Livraison:* ${deliveryFee.toLocaleString()} FCFA\n`
    msg += `✅ *TOTAL:* ${total.toLocaleString()} FCFA`

    window.open(`https://wa.me/221781537817?text=${encodeURIComponent(msg)}`, '_blank')
    showToast('🎉 Commande envoyée via WhatsApp !')

    cart = []; deliveryFee = 0; paymentMethod = ''
    updateCartCount()
    closeCartModal()
}

// ──────────────────────────────────────────────
// FORMULAIRE CONTACT
// ──────────────────────────────────────────────
function sendContactEmail(event) {
    event.preventDefault()
    const name    = document.getElementById('contactName').value
    const email   = document.getElementById('contactEmail').value
    const phone   = document.getElementById('contactPhone').value
    const subject = document.getElementById('contactSubject').value
    const message = document.getElementById('contactMessage').value

    const body = `Nom: ${name}\nEmail: ${email}\nTéléphone: ${phone}\n\nMessage:\n${message}`
    window.location.href = `mailto:kaderthiam389@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    showToast('📧 Ouverture de votre client email...')

    document.getElementById('contactName').value    = ''
    document.getElementById('contactEmail').value   = ''
    document.getElementById('contactPhone').value   = ''
    document.getElementById('contactSubject').value = ''
    document.getElementById('contactMessage').value = ''
}

// ──────────────────────────────────────────────
// UTILITAIRES
// ──────────────────────────────────────────────

// Fermer modals au clic sur le fond
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none'
        document.body.style.overflow = ''
    }
})

// Fermer au clavier Échap
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(m => {
            m.style.display = 'none'
        })
        document.body.style.overflow = ''
    }
})

// Scroll smooth
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href')
            if (href && href !== '#' && href !== 'javascript:void(0)') {
                e.preventDefault()
                const target = document.querySelector(href)
                if (target) {
                    const offset = 80
                    const top = target.getBoundingClientRect().top + window.scrollY - offset
                    window.scrollTo({ top, behavior: 'smooth' })
                }
            }
        })
    })
})

// Header shrink au scroll
window.addEventListener('scroll', () => {
    const header = document.getElementById('mainHeader')
    if (!header) return
    if (window.scrollY > 60) {
        header.style.boxShadow = '0 2px 32px rgba(0,0,0,0.5)'
    } else {
        header.style.boxShadow = 'none'
    }
})
