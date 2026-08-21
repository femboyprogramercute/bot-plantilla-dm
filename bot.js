const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

// Configurar base de datos SQLite local (funciona perfecto en Railway)
const db = new sqlite3.Database('./canales.sqlite', (err) => {
    if (err) {
        console.error('Error al abrir la base de datos', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        // Crear la tabla de canales permitidos si no existe
        db.run(`CREATE TABLE IF NOT EXISTS canales (
            id TEXT PRIMARY KEY
        )`);
    }
});

client.once('ready', () => {
    console.log(`¡Bot encendido como ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // ==========================================
    // COMANDO PARA GESTIONAR CANALES (!dmconfig)
    // ==========================================
    if (message.content.startsWith('!dmconfig')) {
        // Verificar si el usuario es Administrador
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ No tienes permisos de Administrador para usar este comando.");
        }

        const args = message.content.split(' ');
        const accion = args[1]; // 'add' o 'remove'
        const canalMencion = message.mentions.channels.first() || message.channel;

        if (accion === 'add') {
            db.run(`INSERT OR IGNORE INTO canales (id) VALUES (?)`, [canalMencion.id], (err) => {
                if (err) {
                    console.error(err);
                    return message.reply("Hubo un error al guardar el canal.");
                }
                return message.reply(`✅ El canal <#${canalMencion.id}> ha sido **añadido** correctamente a la validación.`);
            });
            return;
        } 
        
        if (accion === 'remove') {
            db.run(`DELETE FROM canales WHERE id = ?`, [canalMencion.id], (err) => {
                if (err) {
                    console.error(err);
                    return message.reply("Hubo un error al eliminar el canal.");
                }
                return message.reply(`❌ El canal <#${canalMencion.id}> ha sido **removido** de la lista.`);
            });
            return;
        }

        return message.reply("⚠️ Uso correcto:\n`!dmconfig add` (añade el canal actual)\n`!dmconfig remove` (quita el canal actual)");
    }

    // ==========================================
    // VALIDACIÓN DE LA PLANTILLA EN LOS 3 CANALES
    // ==========================================
    db.get(`SELECT id FROM canales WHERE id = ?`, [message.channel.id], async (err, row) => {
        if (err || !row) return; // Si el canal no está en la base de datos, no hace nada

        // Tu diseño exacto de la plantilla
        const parte1 = "╭── ⋆˚࿔₊˚⊹`♡ DM ˚₊‧꒷";
        const parte2 = "✦│ ୨୧  Nombre :";
        const parte3 = "✦│ ୨୧  DM : Abierto";
        const parte4 = "✦│ ୨୧  Para :";
        const parte5 = "╰── ❀ 𓂃 ࣪˖ ₊˚⊹";

        const tieneEstructuraCompleta = 
            message.content.includes(parte1) &&
            message.content.includes(parte2) &&
            message.content.includes(parte3) &&
            message.content.includes(parte4) &&
            message.content.includes(parte5);

        // Si alteran la plantilla, se borra y se avisa
        if (!tieneEstructuraCompleta) {
            try {
                await message.delete();

                const aviso = await message.channel.send(
                    `¡Hola <@${message.author.id}>! **No cambies la plantilla por favor.** Solo copia y llena los datos de la plantilla que copiaste.`
                );

                // Borrar la advertencia del bot después de 6 segundos
                setTimeout(() => aviso.delete().catch(() => {}), 6000);

            } catch (error) {
                console.error("No se pudo borrar el mensaje:", error);
            }
        }
    });
});

// El bot inicia sesión usando la variable de entorno de Railway
client.login(process.env.DISCORD_TOKEN);