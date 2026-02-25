const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function grantPremium(username) {
    if (!username) {
        console.error('Hata: Lütfen bir kullanıcı adı belirtin.');
        console.log('Kullanım: node server/admin.js <kullanici_adi>');
        return;
    }

    try {
        const db = await open({
            filename: path.join(__dirname, 'database.sqlite'),
            driver: sqlite3.Database
        });

        const user = await db.get('SELECT id, username FROM users WHERE username = ?', [username]);

        if (!user) {
            console.error(`Hata: '${username}' adlı kullanıcı bulunamadı.`);
            await db.close();
            return;
        }

        await db.run('UPDATE users SET isPremium = 1 WHERE id = ?', [user.id]);

        console.log('------------------------------------------');
        console.log(`BAŞARILI: ${user.username} adlı kullanıcıya PREMIUM verildi.`);
        console.log('------------------------------------------');

        await db.close();
    } catch (error) {
        console.error('Veritabanı hatası:', error.message);
    }
}

const targetUser = process.argv[2];

if (!targetUser) {
    listUsers();
} else {
    grantPremium(targetUser);
}

async function listUsers() {
    try {
        const db = await open({
            filename: path.join(__dirname, 'database.sqlite'),
            driver: sqlite3.Database
        });

        const users = await db.all('SELECT id, username, isPremium FROM users');

        console.log('\n--- KAYITLI KULLANICILAR ---');
        users.forEach(u => {
            console.log(`[${u.id}] ${u.username} - ${u.isPremium ? 'PREMIUM ✅' : 'STANDART ❌'}`);
        });
        console.log('----------------------------\n');
        console.log('Kullanım: node server/admin.js <kullanici_adi>\n');

        await db.close();
    } catch (error) {
        console.error('Hata:', error.message);
    }
}
