const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Configurar base de datos SQLite local
const db = new sqlite3.Database('./canales.sqlite', (err) => {
    if (err) {
        console.error('Error al abrir la base de datos', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        db.run(`CREATE TABLE IF NOT EXISTS canales (
            id TEXT PRIMARY KEY,
            tipo TEXT
        );`);
    }
});

client.once('ready', () => {
    console.log(`¡Bot encendido como ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // ===============================================
    // COMANDO PARA GESTIONAR CANALES Y PLANTILLAS
    // ===============================================
    if (message.content.startsWith('!dmconfig')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ No tienes permisos de Administrador para usar este comando.");
        }

        const args = message.content.split(' ');
        const accion = args[1]; 
        const tipoPlantilla = args[2]; 
        const canalMencion = message.mentions.channels.first() || message.channel;

        if (accion === 'add') {
            if (!tipoPlantilla || (tipoPlantilla !== '1' && tipoPlantilla !== '2')) {
                return message.reply("⚠️ Uso correcto:\n`!dmconfig add 1` (para la plantilla 1)\n`!dmconfig add 2` (para la plantilla de Presentación)");
            }

            db.run(`INSERT OR REPLACE INTO canales (id, tipo) VALUES (?, ?)`, [canalMencion.id, tipoPlantilla], (err) => {
                if (err) {
                    console.error(err);
                    return message.reply("Hubo un error al guardar el canal.");
                }
                return message.reply(`✅ El canal <#${canalMencion.id}> ha sido vinculado a la **Plantilla ${tipoPlantilla}** correctamente.`);
            });
            return;
        }

        if (accion === 'remove') {
            db.run(`DELETE FROM canales WHERE id = ?`, [canalMencion.id], (err) => {
                if (err) {
                    console.error(err);
                    return message.reply("Hubo un error al eliminar el canal.");
                }
                return message.reply(`❌ El canal <#${canalMencion.id}> ha sido **removido** de la lista de validación.`);
            });
            return;
        }

        return message.reply("⚠️ Uso correcto:\n`!dmconfig add 1 o 2`\n`!dmconfig remove`");
    }

    // ===============================================
    // VALIDACIÓN DE PLANTILLAS SEGÚN EL CANAL
    // ===============================================
    db.get(`SELECT tipo FROM canales WHERE id = ?`, [message.channel.id], async (err, row) => {
        if (err || !row) return; // Si el canal no está registrado, no hace nada

        let tieneEstructuraValida = false;

        if (row.tipo === '1') {
            // Plantilla 1 (Tus canales anteriores)
            const parte1 = "╭── ⋆˚࿔₊˚⊹﹒`♡ DM ₊·⁺";
            const parte2 = "│| 9| Nombre :";
            const parte3 = "│| 9| DM : Abierto";
            const parte4 = "│| 9| Para :";
            const parte5 = "│| ╰── ❀ 𓂃 ࣪˖ ₊˚+";
            
            tieneEstructuraValida = message.content.includes(parte1) && 
                                     message.content.includes(parte2) && 
                                     message.content.includes(parte3) && 
                                     message.content.includes(parte4) && 
                                     message.content.includes(parte5);

        } else if (row.tipo === '2') {
            // Plantilla 2 (Presentación COMPLETA con adornos y líneas estructurales)
            const adornoArriba = "♡ Presentación";
            const campo1 = "✦ Nombre:";
            const campo2 = "✦ Apodo:";
            const campo3 = "✦ Nacionalidad:";
            const campo4 = "✦ Edad:";
            const campo5 = "✦ Género:";
            const campo6 = "✦ Orientación:";
            const campo7 = "✦ Altura:";
            const campo8 = "✦ Música favorita:";
            const campo9 = "✦ Gustos:";
            const campo10 = "✦ Pasatiempos:";
            const adornoAbajo = "╰── ❀ 𓂃 ࣪˖ ₊˚⊹";

            tieneEstructuraValida = message.content.includes(adornoArriba) && 
                                     message.content.includes(campo1) && 
                                     message.content.includes(campo2) && 
                                     message.content.includes(campo3) && 
                                     message.content.includes(campo4) && 
                                     message.content.includes(campo5) && 
                                     message.content.includes(campo6) && 
                                     message.content.includes(campo7) && 
                                     message.content.includes(campo8) && 
                                     message.content.includes(campo9) && 
                                     message.content.includes(campo10) && 
                                     message.content.includes(adornoAbajo);
        }

        // Si alteran la plantilla o le borran elementos, se borra y se avisa
        if (!tieneEstructuraValida) {
            try {
                await message.delete();
                const aviso = await message.channel.send(
                    `¡Hola <@${message.author.id}>! **No alteres ni borres las partes de la plantilla.** Usa el formato completo por favor.`
                );
                setTimeout(() => aviso.delete().catch(() => {}), 6000);
            } catch (error) {
                console.error("No se pudo borrar el mensaje:", error);
            }
        }
    });
});

client.login(process.env.DISCORD_TOKEN);

// El bot inicia sesión usando la variable de entorno de Railway
client.login(process.env.DISCORD_TOKEN);
