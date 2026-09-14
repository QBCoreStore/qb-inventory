description 'QBCore Inventory'
name 'qb-inventory'
fx_version 'cerulean'
game 'gta5'
lua54 'yes'
author 'https://discord.gg/qbcoreframework'
version '1.0.0'
shared_scripts {
	'@qb-core/shared/locale.lua',
	'config.lua',
	'locales/en.lua',
}
server_scripts {
	'@oxmysql/lib/MySQL.lua',
	'server/main.lua'
}
client_scripts {
	'client/main.lua',
}

ui_page {
	'html/ui.html'
}
files {
	'html/ui.html',
	'html/css/main.css',
	'html/js/app.js',
	'html/images/*.png',
	'html/images/bones/*.png',
	'html/images/*.jpg',
	'html/ammo_images/*.png',
	'html/attachment_images/*.png',
	'html/*.ttf'
}

escrow_ignore { 
	'config.lua',
	'locales/en.lua',
	'client/main.lua'
}