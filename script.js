// Variables globales
        let users = [];
        let currentUser = null;
        let cart = [];
        let deliveryFee = 0;
        let paymentMethod = '';

        // Fonctions de connexion
        function openLoginModal() {
            document.getElementById('loginModal').style.display = 'block';
        }

        function closeLoginModal() {
            document.getElementById('loginModal').style.display = 'none';
        }

        function showRegister() {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'block';
        }

        function showLogin() {
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
        }

        function handleLogin(event) {
            event.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                currentUser = user;
                alert('Bienvenue ' + user.name + ' !');
                closeLoginModal();
            } else {
                alert('Email ou mot de passe incorrect.');
            }
        }

        function handleRegister(event) {
            event.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const phone = document.getElementById('registerPhone').value;
            const password = document.getElementById('registerPassword').value;

            const existingUser = users.find(u => u.email === email);
            if (existingUser) {
                alert('Un compte existe déjà avec cet email.');
                return;
            }

            users.push({ name, email, phone, password });
            alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            showLogin();
            
            document.getElementById('registerName').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPhone').value = '';
            document.getElementById('registerPassword').value = '';
        }

        // Fonctions du panier
        function addToCart(name, price) {
            const existingItem = cart.find(item => item.name === name);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({ name, price, quantity: 1 });
            }
            updateCartCount();
            alert(name + ' ajouté au panier !');
        }

        function updateCartCount() {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            document.getElementById('cartCount').textContent = totalItems;
        }

        function openCartModal() {
            document.getElementById('cartModal').style.display = 'block';
            displayCart();
        }

        function closeCartModal() {
            document.getElementById('cartModal').style.display = 'none';
        }

        function displayCart() {
            const cartContent = document.getElementById('cartContent');
            
            if (cart.length === 0) {
                cartContent.innerHTML = '<div class="empty-cart"><div class="empty-cart-icon">🛒</div><h3 style="color: #d4af37;">Votre panier est vide</h3><p style="color: #ccc;">Ajoutez des parfums pour commencer !</p></div>';
                document.getElementById('checkoutSection').style.display = 'none';
                return;
            }

            let cartHTML = '<div class="cart-items">';
            cart.forEach((item, index) => {
                cartHTML += '<div class="cart-item"><div class="cart-item-info"><h4>' + item.name + '</h4><p>' + item.price.toLocaleString() + ' FCFA × ' + item.quantity + '</p></div><div class="cart-item-actions"><button class="qty-btn" onclick="decreaseQty(' + index + ')">-</button><span class="qty-display">' + item.quantity + '</span><button class="qty-btn" onclick="increaseQty(' + index + ')">+</button><button class="remove-btn" onclick="removeFromCart(' + index + ')">🗑️</button></div></div>';
            });
            cartHTML += '</div>';

            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartHTML += '<div class="order-summary"><div class="summary-row"><span>Sous-total</span><span>' + subtotal.toLocaleString() + ' FCFA</span></div><div class="summary-row"><span>Articles</span><span>' + cart.reduce((sum, item) => sum + item.quantity, 0) + '</span></div></div>';

            cartContent.innerHTML = cartHTML;
            document.getElementById('checkoutSection').style.display = 'block';
            updateOrderSummary();
        }

        function increaseQty(index) {
            cart[index].quantity++;
            displayCart();
            updateCartCount();
        }

        function decreaseQty(index) {
            if (cart[index].quantity > 1) {
                cart[index].quantity--;
                displayCart();
                updateCartCount();
            }
        }

        function removeFromCart(index) {
            cart.splice(index, 1);
            displayCart();
            updateCartCount();
        }

        function selectDelivery(type, fee) {
            deliveryFee = fee;
            document.querySelectorAll('.delivery-option').forEach(opt => {
                if (opt.querySelector('input[name="delivery"]')) {
                    opt.classList.remove('selected');
                }
            });
            event.currentTarget.classList.add('selected');
            document.querySelector('input[value="' + type + '"]').checked = true;
            updateOrderSummary();
        }

        function selectPayment(method) {
            paymentMethod = method;
            document.querySelectorAll('.delivery-option').forEach(opt => {
                if (opt.querySelector('input[name="payment"]')) {
                    opt.classList.remove('selected');
                }
            });
            event.currentTarget.classList.add('selected');
            document.querySelector('input[value="' + method + '"]').checked = true;
        }

        function updateOrderSummary() {
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const total = subtotal + deliveryFee;
            
            document.getElementById('summarySubtotal').textContent = subtotal.toLocaleString() + ' FCFA';
            document.getElementById('summaryDelivery').textContent = deliveryFee.toLocaleString() + ' FCFA';
            document.getElementById('summaryTotal').textContent = total.toLocaleString() + ' FCFA';
        }

        function confirmOrder(event) {
            event.preventDefault();
            
            const name = document.getElementById('customerName').value;
            const phone = document.getElementById('customerPhone').value;
            const address = document.getElementById('customerAddress').value;
            const city = document.getElementById('customerCity').value;
            
            if (deliveryFee === 0) {
                alert('Veuillez sélectionner un mode de livraison !');
                return;
            }

            if (!paymentMethod) {
                alert('Veuillez sélectionner un mode de paiement !');
                return;
            }

            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const total = subtotal + deliveryFee;

            let paymentText = '';
            if (paymentMethod === 'wave') {
                paymentText = '💙 Wave';
            } else if (paymentMethod === 'om') {
                paymentText = '🟠 Orange Money';
            } else if (paymentMethod === 'card') {
                paymentText = '💳 Carte Bancaire';
            } else if (paymentMethod === 'cash') {
                paymentText = '💵 Paiement à la livraison';
            }

            let orderDetails = '🛍️ *NOUVELLE COMMANDE MATA LUXURY*\n\n';
            orderDetails += '👤 *Client:* ' + name + '\n';
            orderDetails += '📱 *Téléphone:* ' + phone + '\n';
            orderDetails += '📍 *Adresse:* ' + address + ', ' + city + '\n';
            orderDetails += '💰 *Paiement:* ' + paymentText + '\n\n';
            orderDetails += '🎁 *Commande:*\n';
            
            cart.forEach(item => {
                orderDetails += '• ' + item.name + ' x' + item.quantity + ' = ' + (item.price * item.quantity).toLocaleString() + ' FCFA\n';
            });
            
            orderDetails += '\n💰 *Sous-total:* ' + subtotal.toLocaleString() + ' FCFA\n';
            orderDetails += '🚚 *Livraison:* ' + deliveryFee.toLocaleString() + ' FCFA\n';
            orderDetails += '✅ *TOTAL À PAYER:* ' + total.toLocaleString() + ' FCFA';

            const whatsappNumber = '221781537817';
            const whatsappURL = 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(orderDetails);
            
            window.open(whatsappURL, '_blank');
            
            alert('Votre commande a été envoyée via WhatsApp ! Notre équipe vous contactera pour finaliser le paiement 🎉');
            
            cart = [];
            deliveryFee = 0;
            paymentMethod = '';
            updateCartCount();
            closeCartModal();
        }

        function sendContactEmail(event) {
            event.preventDefault();
            
            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            const phone = document.getElementById('contactPhone').value;
            const subject = document.getElementById('contactSubject').value;
            const message = document.getElementById('contactMessage').value;

            const mailtoLink = 'mailto:kaderthiam389@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent('Nom: ' + name + '\nEmail: ' + email + '\nTéléphone: ' + phone + '\n\nMessage:\n' + message);

            window.location.href = mailtoLink;
            alert('Votre client email va s\'ouvrir.');

            document.getElementById('contactName').value = '';
            document.getElementById('contactEmail').value = '';
            document.getElementById('contactPhone').value = '';
            document.getElementById('contactSubject').value = '';
            document.getElementById('contactMessage').value = '';
        }

        // Fermer modal en cliquant à l'extérieur
        window.onclick = function(event) {
            if (event.target.className === 'modal') {
                event.target.style.display = 'none';
            }
        }

        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href && href !== '#' && href !== 'javascript:void(0)') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });