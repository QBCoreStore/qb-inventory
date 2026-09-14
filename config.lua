Config = {}

Config.UseTarget = GetConvar('UseTarget', 'false') == 'true' -- Use qb-target interactions (don't change this, go to your server.cfg and add `setr UseTarget true` to use this and just that from true to false or the other way around)
Config.OpenInventory = "TAB"
Config.OpenHotbar = "Z"

Config.BackbagAnimation = true
Config.BackbagAnimationdict = "anim@heists@ornate_bank@grab_cash"
-- Config.BackbagAnimationdict = "anim@amb@world_human_valet@formal_right@base@"
Config.BackbagAnimationflag = "intro"
Config.WaitforopenInventory = 400

Config.MaxInventoryWeight = 240000 -- Max weight a player can carry (default 120kg, written in grams)
Config.MaxInventorySlots = 41 -- Max inventory slots for a player
Config.CleanupDropTime = 15 * 60 -- How many seconds it takes for drops to be untouched before being deleted
Config.MaxDropViewDistance = 12.5 -- The distance in GTA Units that a drop can be seen
Config.UseItemDrop = true -- This will enable item object to spawn on drops instead of markers
Config.Weaponsonback = true -- If you want weapon showen on bag 

Config.ItemDropObject = `prop_nigel_bag_pickup` -- if Config.UseItemDrop is true, this will be the prop that spawns for the item
Config.VendingObjects = {""}
Config.BinObjects = {""}
Config.CraftingObject = ``

Config.Webhooks = {
    ["default"] = "",
    ["playermoney"] ="",
    ["playerinventory"] = "",
    ["giveitem"] = "",
    ["cuffing"] = "",
    ["drop"] = "",
    ["trunk"] = "",
    ["stash"] = "",
    ["glovebox"] = "",
    ["banking"] = "",
    ["vehicleshop"] = "",
    ["vehicleupgrades"] = "",
    ["shops"] = "",
    ["dealers"] = "",
    ["storerobbery"] = "",
    ["bankrobbery"] = "",
    ["powerplants"] = "",
    ["death"] = "",
    ["joinleave"] = "",
    ["ooc"] = "",
    ["report"] = "",
    ["me"] = "",
    ["pmelding"] = "",
    ["112"] = "",
    ["bans"] = "",
    ["anticheat"] = "",
    ["weather"] = "",
    ["moneysafes"] = "",
    ["bennys"] = "",
}

Config.Colors = {
    ["default"] = 16711680,
    ["blue"] = 25087,
    ["green"] = 762640,
    ["white"] = 16777215,
    ["black"] = 0,
    ["orange"] = 16743168,
    ["lightgreen"] = 65309,
    ["yellow"] = 15335168,
    ["turqois"] = 62207,
    ["pink"] = 16711900,
    ["red"] = 16711680,
}
Config.VendingItem = {
    [1] = {
        name = "kurkakola",
        price = 10,
        amount = 50,
        info = {},
        type = "item",
        slot = 1,
    },
    [2] = {
        name = "water_bottle",
        price = 10,
        amount = 50,
        info = {},
        type = "item",
        slot = 2,
    }
}

Config.CraftingItems = {
    [1] = {
        name = "lockpick",
        amount = 50,
        info = {},
        costs = {
            ["metalscrap"] = 22,
            ["plastic"] = 32,
        },
        type = "item",
        slot = 1,
        threshold = 0,
        points = 1,
    },
    [2] = {
        name = "screwdriverset",
        amount = 50,
        info = {},
        costs = {
            ["metalscrap"] = 30,
            ["plastic"] = 42,
        },
        type = "item",
        slot = 2,
        threshold = 0,
        points = 2,
    }
}

Config.AttachmentCraftingLocation = vector3(-254.66, 2944.76, 29.92)
Config.AttachmentCrafting = {
    ["items"] = {
        [1] = {
            name = "pistol_extendedclip",
            amount = 50,
            info = {},
            costs = {
                ["metalscrap"] = 140,
                ["steel"] = 250,
                ["rubber"] = 60,
            },
            type = "item",
            slot = 1,
            threshold = 0,
            points = 1,
        },
        [2] = {
            name = "pistol_suppressor",
            amount = 50,
            info = {},
            costs = {
                ["metalscrap"] = 165,
                ["steel"] = 285,
                ["rubber"] = 75,
            },
            type = "item",
            slot = 2,
            threshold = 0,
            points = 1,
        },
    }
}

Config.MaximumAmmoValues = {["pistol"] = 250,["smg"] = 250,["shotgun"] = 200,["rifle"] = 250,}

BackEngineVehicles = {
    [`ninef`] = true,
    [`adder`] = true,
    [`vagner`] = true,
    [`t20`] = true,
    [`infernus`] = true,
    [`zentorno`] = true,
    [`reaper`] = true,
    [`comet2`] = true,
    [`comet3`] = true,
    [`jester`] = true,
    [`jester2`] = true,
    [`cheetah`] = true,
    [`cheetah2`] = true,
    [`prototipo`] = true,
    [`turismor`] = true,
    [`pfister811`] = true,
    [`ardent`] = true,
    [`nero`] = true,
    [`nero2`] = true,
    [`tempesta`] = true,
    [`vacca`] = true,
    [`bullet`] = true,
    [`osiris`] = true,
    [`entityxf`] = true,
    [`turismo2`] = true,
    [`fmj`] = true,
    [`re7b`] = true,
    [`tyrus`] = true,
    [`italigtb`] = true,
    [`penetrator`] = true,
    [`monroe`] = true,
    [`ninef2`] = true,
    [`stingergt`] = true,
    [`surfer`] = true,
    [`surfer2`] = true,
    [`gp1`] = true,
    [`autarch`] = true,
    [`tyrant`] = true
}

local Bags = {[40] = true,[41] = true,[44] = true,[45] = true}
Config.Commands = { --Commands for the Clothing
    ["TOP"] = { Func = function() ToggleClothing("Top") end, Sprite = "top", Desc = "", Button = 1, Name = "Top" },
    ["GLOVES"] = { Func = function() ToggleClothing("Gloves") end, Sprite = "gloves", Desc = "", Button = 2, Name = "Gloves" },
    ["VISOR"] = { Func = function() ToggleProps("Visor") end, Sprite = "visor", Desc = "", Button = 3, Name = "Visor" },
    ["BAG"] = { Func = function() ToggleClothing("Bag") end, Sprite = "bag", Desc = "", Button = 8, Name = "Bag" },
    ["SHOES"] = { Func = function() ToggleClothing("Shoes") end, Sprite = "shoes", Desc = "", Button = 5, Name = "Shoes" },
    ["VEST"] = { Func = function() ToggleClothing("Vest") end, Sprite = "vest", Desc = "", Button = 14, Name = "Vest" },
    ["HAIR"] = { Func = function() ToggleClothing("Hair") end, Sprite = "hair", Desc = "", Button = 7, Name = "Hair" },
    ["HAT"] = { Func = function() ToggleProps("Hat") end, Sprite = "hat", Desc = "", Button = 4, Name = "Hat" },
    ["GLASSES"] = { Func = function() ToggleProps("Glasses") end, Sprite = "glasses", Desc = "", Button = 9, Name = "Glasses", },
    ["EAR"] = { Func = function() ToggleProps("Ear") end, Sprite = "ear", Desc = "", Button = 10, Name = "Ear" },
    ["NECK"] = { Func = function() ToggleClothing("Neck") end, Sprite = "neck", Desc = "", Button = 11, Name = "Neck" },
    ["WATCH"] = { Func = function() ToggleProps("Watch") end, Sprite = "watch", Desc = "", Button = 12, Name = "Watch", Rotation = 5.0 },
    ["BRACELET"] = { Func = function() ToggleProps("Bracelet") end, Sprite = "bracelet", Desc = "", Button = 13, Name = "Bracelet" },
    ["MASK"] = { Func = function() ToggleClothing("Mask") end, Sprite = "mask", Desc = "", Button = 6, Name = "Mask", },
    ["PANTS"] = {Func = function() ToggleClothing("Pants", true) end,Sprite = "pants",Desc = "",Name = "Pants",OffsetX = -0.04,OffsetY = 0.0,},
    ["SHIRT"] = { Func = function() ToggleClothing("Shirt", true) end, Sprite = "shirt", Desc = "", Name = "Shirt", OffsetX = 0.04, OffsetY = 0.0, },
    ["RESET"] = { Func = function() if not ResetClothing(true) then Notify(Lang("AlreadyWearing")) end end, Sprite = "reset", Desc = "", Name = "Reset", OffsetX = 0.12, OffsetY = 0.2, Rotate = true },
    ["BAGOFF"] = { Func = function() ToggleClothing("Bagoff", true) end, Sprite = "bagoff", SpriteFunc = function() local Bag = GetPedDrawableVariation(PlayerPedId(), 5) local BagOff = LastEquipped["Bagoff"] if LastEquipped["Bagoff"] then if Bags[BagOff.Drawable] then return "bagoff" else return "paraoff" end end if Bag ~= 0 then if Bags[Bag] then return "bagoff" else return "paraoff" end else return false end end, Desc = "", Name = "Bag", OffsetX = -0.12, OffsetY = 0.2, },	

}
