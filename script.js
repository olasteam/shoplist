/**
 * ************************************************************
 * بخش ۱: مقداردهی اولیه و ارجاعات (References)
 * ************************************************************
 */

// ارجاع به دیتابیس Firebase (اطمینان از وجود متغیر سراسری firebase)
const database = firebase.database();
// ارجاع به نود اصلی لیست خرید در دیتابیس
const listRef = database.ref('shoppingList'); 

const shoppingListEl = document.getElementById('shoppingList');
const addItemForm = document.getElementById('addItemForm');

/**
 * ************************************************************
 * بخش ۲: عملیات Firebase (CRUD)
 * ************************************************************
 */

// ۱. افزودن آیتم جدید به دیتابیس
addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('itemName');
    const quantityInput = document.getElementById('itemQuantity');
    const unitInput = document.getElementById('itemUnit');

    const newItem = {
        name: nameInput.value.trim(),
        quantity: quantityInput.value,
        unit: unitInput.value,
        purchased: false, // وضعیت پیش‌فرض: خریداری نشده
        timestamp: Date.now() // برای مرتب‌سازی
    };

    if (newItem.name === "") {
        alert("لطفاً نام محصول را وارد کنید.");
        return;
    }

    // استفاده از push برای ایجاد یک کلید یکتای خودکار و ذخیره داده
    listRef.push(newItem)
        .then(() => {
            // پاک کردن فرم پس از موفقیت
            nameInput.value = '';
            quantityInput.value = '1';
        })
        .catch((error) => {
            console.error("خطا در افزودن آیتم: ", error);
            // اینجا خطا را نمایش می‌دهد که به عیب‌یابی شما در کنسول کمک می‌کند
        });
});

// ۲. تغییر وضعیت خرید
// این تابع در HTML با `onclick` فراخوانی می‌شود
window.toggleItemPurchased = (key, currentStatus) => {
    // به‌روزرسانی وضعیت در گره مشخص شده توسط کلید (key)
    listRef.child(key).update({
        purchased: !currentStatus
    }).catch(error => {
        console.error("خطا در به‌روزرسانی وضعیت: ", error);
    });
};

// ۳. حذف آیتم
// این تابع در HTML با `onclick` فراخوانی می‌شود
window.deleteItem = (key) => {
    if (!confirm("آیا از حذف این آیتم مطمئن هستید؟")) return;

    // حذف گره مشخص شده
    listRef.child(key).remove().catch(error => {
        console.error("خطا در حذف آیتم: ", error);
    });
};

/**
 * ************************************************************
 * بخش ۳: Realtime Listener و رندر (همگام‌سازی لحظه‌ای)
 * ************************************************************
 */

// تابع ساخت DOM یک آیتم
function createListItem(key, item) {
    const li = document.createElement('li');
    li.dataset.key = key; // کلید Firebase به عنوان شناسه
    li.className = item.purchased ? 'purchased' : '';

    li.innerHTML = `
        <span class="item-name">${item.name}</span>
        <div class="item-info">
            <span class="item-quantity-text">${item.quantity} ${item.unit}</span>
            <div class="actions">
                <button class="purchase-btn" title="تغییر وضعیت خرید" onclick="toggleItemPurchased('${key}', ${item.purchased})">
                    ${item.purchased ? '✅' : '⏳'}
                </button>
                <button class="delete-btn" title="حذف آیتم" onclick="deleteItem('${key}')">🗑️</button>
            </div>
        </div>
    `;
    return li;
}

// listener اصلی: این تابع هر زمان که دیتابیس تغییر کند، اجرا می‌شود.
listRef.on('value', (snapshot) => {
    shoppingListEl.innerHTML = ''; // پاک کردن لیست قبلی
    
    if (!snapshot.exists()) {
        shoppingListEl.innerHTML = '<p style="text-align: center; color: #7f8c8d;">لیست خرید خالی است.</p>';
        return;
    }

    const items = [];
    // پیمایش روی داده‌های دریافتی از دیتابیس
    snapshot.forEach((childSnapshot) => {
        const key = childSnapshot.key;
        const item = childSnapshot.val();
        items.push({ key, ...item });
    });

    // مرتب‌سازی: آیتم‌های خریداری نشده در بالا قرار می‌گیرند، سپس آیتم‌های خریداری شده.
    const sortedItems = items.sort((a, b) => a.purchased - b.purchased || a.timestamp - b.timestamp);

    sortedItems.forEach(item => {
        shoppingListEl.appendChild(createListItem(item.key, item));
    });
}, (error) => {
    console.error("خطا در همگام‌سازی دیتابیس: ", error);
    // این خطا در صورت قطع ارتباط با Firebase رخ می‌دهد
});