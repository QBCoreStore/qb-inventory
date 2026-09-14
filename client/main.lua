--#region Variables

local QBCore = exports['qb-core']:GetCoreObject()
local PlayerData = QBCore.Functions.GetPlayerData()
local inInventory = false
local currentWeapon = nil
local currentOtherInventory = nil
local Drops = {}
local CurrentDrop = nil
local DropsNear = {}
local CurrentVehicle = nil
local CurrentGlovebox = nil
local CurrentStash = nil
local isCrafting = false
local isHotbar = false
local WeaponAttachments = {}
local bagEquipped, bagObj
local hash = `p_michael_backpack_s`

local function PutOnBag()
    local ped = PlayerPedId()
    local x, y, z = table.unpack(GetOffsetFromEntityInWorldCoords(ped,0.0,3.0,0.5))
    RequestModel(hash, 100)
    bagObj = CreateObjectNoOffset(hash, x, y, z, true, false)
    AttachEntityToEntity(bagObj, ped, GetPedBoneIndex(ped, 24818), 0.07, -0.11, -0.05, 0.0, 90.0, 175.0, true, true, false, true, 1, true)
    bagEquipped = true
    if Config.BackbagAnimation then
        loadAnimDict(Config.BackbagAnimationdict) 
        TaskPlayAnim(PlayerPedId(), Config.BackbagAnimationdict, Config.BackbagAnimationflag, 8.0, 1.0, -1, 49, 0, 0, 0, 0)
        Wait(Config.WaitforopenInventory)
        ClearPedTasks(PlayerPedId())
    end
end
function loadAnimDict(dict)
    while not HasAnimDictLoaded(dict) do
        RequestAnimDict( dict )
        Citizen.Wait(5)
    end
end
local function RemoveBag()
    if DoesEntityExist(bagObj) then
        DeleteObject(bagObj)
    end
    SetModelAsNoLongerNeeded(hash)
    bagObj = nil
    bagEquipped = nil
end

---Checks if you have an item or not
---@param items string | string[] | table<string, number> The items to check, either a string, array of strings or a key-value table of a string and number with the string representing the name of the item and the number representing the amount
---@param amount? number The amount of the item to check for, this will only have effect when items is a string or an array of strings
---@return boolean success Returns true if the player has the item
local function HasItem(items, amount)
    local isTable = type(items) == 'table'
    local isArray = isTable and table.type(items) == 'array' or false
    local totalItems = #items
    local count = 0
    local kvIndex = 2
	if isTable and not isArray then
        totalItems = 0
        for _ in pairs(items) do totalItems += 1 end
        kvIndex = 1
    end
    for _, itemData in pairs(PlayerData.items) do
        if isTable then
            for k, v in pairs(items) do
                local itemKV = {k, v}
                if itemData and itemData.name == itemKV[kvIndex] and ((amount and itemData.amount >= amount) or (not isArray and itemData.amount >= v) or (not amount and isArray)) then
                    count += 1
                end
            end
            if count == totalItems then
                return true
            end
        else -- Single item as string
            if itemData and itemData.name == items and (not amount or (itemData and amount and itemData.amount >= amount)) then
                return true
            end
        end
    end
    return false
end

exports("HasItem", HasItem)

---Gets the closest vending machine object to the client
---@return integer closestVendingMachine
local function GetClosestVending()
    local ped = PlayerPedId()
    local pos = GetEntityCoords(ped)
    local object = nil
    for _, machine in pairs(Config.VendingObjects) do
        local ClosestObject = GetClosestObjectOfType(pos.x, pos.y, pos.z, 0.75, joaat(machine), false, false, false)
        if ClosestObject ~= 0 then
            if object == nil then
                object = ClosestObject
            end
        end
    end
    return object
end

---Opens the vending machine shop
local function OpenVending()
    local ShopItems = {}
    ShopItems.label = "Otomat"
    ShopItems.items = Config.VendingItem
    ShopItems.slots = #Config.VendingItem
    TriggerServerEvent("inventory:server:OpenInventory", "shop", "Vendingshop_"..math.random(1, 99), ShopItems)
end

---Draws 3d text in the world on the given position
---@param x number The x coord of the text to draw
---@param y number The y coord of the text to draw
---@param z number The z coord of the text to draw
---@param text string The text to display
local function DrawText3Ds(x, y, z, text)
    SetTextScale(0.35, 0.35)
    SetTextFont(4)
    SetTextProportional(1)
    SetTextColour(255, 255, 255, 215)
    SetTextEntry("STRING")
    SetTextCentre(true)
    AddTextComponentString(text)
    SetDrawOrigin(x,y,z, 0)
    DrawText(0.0, 0.0)
    local factor = string.len(text) / 370
    DrawRect(0.0, 0.0125, 0.017 + factor, 0.03, 0, 0, 0, 75)
    ClearDrawOrigin()
end

---Load an animation dictionary before playing an animation from it
---@param dict string Animation dictionary to load
local function LoadAnimDict(dict)
    if HasAnimDictLoaded(dict) then return end

    RequestAnimDict(dict)
    while not HasAnimDictLoaded(dict) do
        Wait(10)
    end
end

---Returns a formatted attachments table from item data
---@param itemdata table Data of an item
---@return table attachments
local function FormatWeaponAttachments(itemdata)
    local attachments = {}
    itemdata.name = itemdata.name:upper()
    if itemdata.info.attachments ~= nil and next(itemdata.info.attachments) ~= nil then
        for _, v in pairs(itemdata.info.attachments) do
            if WeaponAttachments[itemdata.name] ~= nil then
                for key, value in pairs(WeaponAttachments[itemdata.name]) do
                    if value.component == v.component then
                        local item = value.item
                        attachments[#attachments+1] = {
                            attachment = key,
                            label = QBCore.Shared.Items[item].label
                            --label = value.label
                        }
                    end
                end
            end
        end
    end
    return attachments
end

---Checks if the vehicle's engine is at the back or not
---@param vehModel integer The model hash of the vehicle
---@return boolean isBackEngine
local function IsBackEngine(vehModel)
    return BackEngineVehicles[vehModel]
end

---Opens the trunk of the closest vehicle
local function OpenTrunk()
    local vehicle = QBCore.Functions.GetClosestVehicle()
    LoadAnimDict("amb@prop_human_bum_bin@idle_b")
    TaskPlayAnim(PlayerPedId(), "amb@prop_human_bum_bin@idle_b", "idle_d", 4.0, 4.0, -1, 50, 0, false, false, false)
    if IsBackEngine(GetEntityModel(vehicle)) then
        SetVehicleDoorOpen(vehicle, 4, false, false)
    else
        SetVehicleDoorOpen(vehicle, 5, false, false)
    end
end

---Closes the trunk of the closest vehicle
local function CloseTrunk()
    local vehicle = QBCore.Functions.GetClosestVehicle()
    LoadAnimDict("amb@prop_human_bum_bin@idle_b")
    TaskPlayAnim(PlayerPedId(), "amb@prop_human_bum_bin@idle_b", "exit", 4.0, 4.0, -1, 50, 0, false, false, false)
    if IsBackEngine(GetEntityModel(vehicle)) then
        SetVehicleDoorShut(vehicle, 4, false)
    else
        SetVehicleDoorShut(vehicle, 5, false)
    end
end

local PedPreview = nil

local function PedPreviewActive(state)
    if state then
        if not PedPreview then
            SetFrontendActive(true)
            ActivateFrontendMenu('FE_MENU_VERSION_EMPTY', true, -1)
            Citizen.Wait(100)
            SetMouseCursorVisible(false)
            
            PedPreview = ClonePed(PlayerPedId(), 0, false, false)
            local x, y, z = table.unpack(GetEntityCoords(PedPreview))
            ReplaceHudColourWithRgba(117, 0, 0, 0, 0)
            SetEntityCoords(PedPreview, x, y, z - 10)
            FreezeEntityPosition(PedPreview, true)
            SetEntityVisible(PedPreview, false, false)
            NetworkSetEntityInvisibleToNetwork(PedPreview, false)
            Wait(200)
            SetPedAsNoLongerNeeded(PedPreview)
            GivePedToPauseMenu(PedPreview, 1)
            
            SetPauseMenuPedLighting(true)
            SetPauseMenuPedSleepState(true)
        end
    elseif PedPreview then
        DeleteEntity(PedPreview)
        PedPreview = nil
        SetFrontendActive(false)
    end
end

local function closeInventory()
    SendNUIMessage({
        action = "close",
    })
    RemoveBag()

    PedPreviewActive(false)
    TriggerScreenblurFadeOut(0)
end

---Toggles the hotbar of the inventory
---@param toggle boolean If this is true, the hotbar will open
local function ToggleHotbar(toggle)
    local HotbarItems = {
        [1] = PlayerData.items[1],
        [2] = PlayerData.items[2],
        [3] = PlayerData.items[3],
        [4] = PlayerData.items[4],
        [5] = PlayerData.items[5],
        [41] = PlayerData.items[41],
    }

    SendNUIMessage({
        action = "toggleHotbar",
        open = toggle,
        items = HotbarItems
    })
end

---Plays the opening animation of the inventory
local function openAnim()
    LoadAnimDict('pickup_object')
    TaskPlayAnim(PlayerPedId(),'pickup_object', 'putdown_low', 5.0, 1.5, 1.0, 48, 0.0, 0, 0, 0)
end

---Setup item info for items from Config.CraftingItems
local function ItemsToItemInfo()
	local itemInfos = {
		[1] = {costs = QBCore.Shared.Items["metalscrap"]["label"] .. ": 22x, " ..QBCore.Shared.Items["plastic"]["label"] .. ": 32x."},
		[2] = {costs = QBCore.Shared.Items["metalscrap"]["label"] .. ": 30x, " ..QBCore.Shared.Items["plastic"]["label"] .. ": 42x."},
		[3] = {costs = QBCore.Shared.Items["metalscrap"]["label"] .. ": 30x, " ..QBCore.Shared.Items["plastic"]["label"] .. ": 45x, "..QBCore.Shared.Items["aluminum"]["label"] .. ": 28x."},
		[4] = {costs = QBCore.Shared.Items["electronickit"]["label"] .. ": 2x, " ..QBCore.Shared.Items["plastic"]["label"] .. ": 52x, "..QBCore.Shared.Items["steel"]["label"] .. ": 40x."},
		[5] = {costs = QBCore.Shared.Items["metalscrap"]["label"] .. ": 10x, " ..QBCore.Shared.Items["plastic"]["label"] .. ": 50x, "..QBCore.Shared.Items["aluminum"]["label"] .. ": 30x, "..QBCore.Shared.Items["iron"]["label"] .. ": 17x, "..QBCore.Shared.Items["electronickit"]["label"] .. ": 1x."},
		[6] = {costs = QBCore.Shared.Items["metalscrap"]["label"] .. ": 36x, " ..QBCore.Shared.Items["steel"]["label"] .. ": 24x, "..QBCore.Shared.Items["aluminum"]["label"] .. ": 28x."},
		[7] = {costs = QBCore.Shared.Items["metalscrap"]["label"] .. ": 32x, " ..QBCore.Shared.Items["steel"]["label"] .. ": 43x, "..QBCore.Shared.Items["plastic"]["label"] .. ": 61x."},
		[8] = {costs = QBCore.Shared.Items["metalscrap"]["label"] .. ": 50x, " ..QBCore.Shared.Items["steel"]["label"] .. ": 37x, "..QBCore.Shared.Items["copper"]["label"] .. ": 26x."},
		[9] = {costs = QBCore.Shared.Items["iron"]["label"] .. ": 60x, " ..QBCore.Shared.Items["glass"]["label"] .. ": 30x."},
		[10] = {costs = QBCore.Shared.Items["aluminum"]["label"] .. ": 60x, " ..QBCore.Shared.Items["glass"]["label"] .. ": 30x."},
		[11] = {costs = QBCore.Shared.Items["iron"]["label"] .. ": 33x, " ..QBCore.Shared.Items["steel"]["label"] .. ": 44x, "..QBCore.Shared.Items["plastic"]["label"] .. ": 55x, "..QBCore.Shared.Items["aluminum"]["label"] .. ": 22x."},
		[12] = {costs = QBCore.Shared.Items["iron"]["label"] .. ": 50x, " ..QBCore.Shared.Items["steel"]["label"] .. ": 50x, "..QBCore.Shared.Items["screwdriverset"]["label"] .. ": 3x, "..QBCore.Shared.Items["advancedlockpick"]["label"] .. ": 2x."},
	}

	local items = {}
	for _, item in pairs(Config.CraftingItems) do
		local itemInfo = QBCore.Shared.Items[item.name:lower()]
		items[item.slot] = {
			name = itemInfo["name"],
			amount = tonumber(item.amount),
			info = itemInfos[item.slot],
			label = itemInfo["label"],
			description = itemInfo["description"] or "",
			weight = itemInfo["weight"],
			type = itemInfo["type"],
			unique = itemInfo["unique"],
			useable = itemInfo["useable"],
			image = itemInfo["image"],
			slot = item.slot,
			costs = item.costs,
			threshold = item.threshold,
			points = item.points,
		}
	end
	Config.CraftingItems = items
end

---Setup item info for items from Config.AttachmentCrafting["items"]
local function SetupAttachmentItemsInfo()
	local itemInfos = {
		[1] = {costs = QBCore.Shared.Items["metalscrap"]["label"] .. ": 140x, " .. QBCore.Shared.Items["steel"]["label"] .. ": 250x, " .. QBCore.Shared.Items["rubber"]["label"] .. ": 60x"},
		[2] = {costs = QBCore.Shared.Items["metalscrap"]["label"] .. ": 165x, " .. QBCore.Shared.Items["steel"]["label"] .. ": 285x, " .. QBCore.Shared.Items["rubber"]["label"] .. ": 75x"},
		[3] = {costs = QBCore.Shared.Items["metalscrap"]["label"] .. ": 190x, " .. QBCore.Shared.Items["steel"]["label"] .. ": 305x, " .. QBCore.Shared.Items["rubber"]["label"] .. ": 85x, " .. QBCore.Shared.Items["smg_extendedclip"]["label"] .. ": 1x"},
		[4] = {costs = QBCore.Shared.Items["metalscrap"]["label"] .. ": 205x, " .. QBCore.Shared.Items["steel"]["label"] .. ": 340x, " .. QBCore.Shared.Items["rubber"]["label"] .. ": 110x, " .. QBCore.Shared.Items["smg_extendedclip"]["label"] .. ": 2x"},
		[5] = {costs = QBCore.Shared.Items["metalscrap"]["label"] .. ": 230x, " .. QBCore.Shared.Items["steel"]["label"] .. ": 365x, " .. QBCore.Shared.Items["rubber"]["label"] .. ": 130x"},
		[6] = {costs = QBCore.Shared.Items["metalscrap"]["label"] .. ": 255x, " .. QBCore.Shared.Items["steel"]["label"] .. ": 390x, " .. QBCore.Shared.Items["rubber"]["label"] .. ": 145x"},
		[7] = {costs = QBCore.Shared.Items["metalscrap"]["label"] .. ": 270x, " .. QBCore.Shared.Items["steel"]["label"] .. ": 435x, " .. QBCore.Shared.Items["rubber"]["label"] .. ": 155x"},
		[8] = {costs = QBCore.Shared.Items["metalscrap"]["label"] .. ": 300x, " .. QBCore.Shared.Items["steel"]["label"] .. ": 469x, " .. QBCore.Shared.Items["rubber"]["label"] .. ": 170x"},
	}

	local items = {}
	for _, item in pairs(Config.AttachmentCrafting["items"]) do
		local itemInfo = QBCore.Shared.Items[item.name:lower()]
		items[item.slot] = {
			name = itemInfo["name"],
			amount = tonumber(item.amount),
			info = itemInfos[item.slot],
			label = itemInfo["label"],
			description = itemInfo["description"] or "",
			weight = itemInfo["weight"],
			unique = itemInfo["unique"],
			useable = itemInfo["useable"],
			image = itemInfo["image"],
			slot = item.slot,
			costs = item.costs,
			threshold = item.threshold,
			points = item.points,
		}
	end
	Config.AttachmentCrafting["items"] = items
end

---Runs ItemsToItemInfo() and checks if the client has enough reputation to support the threshold, otherwise the items is not available to craft for the client
---@return table items
local function GetThresholdItems()
	ItemsToItemInfo()
	local items = {}
	for k in pairs(Config.CraftingItems) do
		if PlayerData.metadata["craftingrep"] >= Config.CraftingItems[k].threshold then
			items[k] = Config.CraftingItems[k]
		end
	end
	return items
end

---Runs SetupAttachmentItemsInfo() and checks if the client has enough reputation to support the threshold, otherwise the items is not available to craft for the client
---@return table items
local function GetAttachmentThresholdItems()
	SetupAttachmentItemsInfo()
	local items = {}
	for k in pairs(Config.AttachmentCrafting["items"]) do
		if PlayerData.metadata["attachmentcraftingrep"] >= Config.AttachmentCrafting["items"][k].threshold then
			items[k] = Config.AttachmentCrafting["items"][k]
		end
	end
	return items
end

---Removes drops in the area of the client
---@param index integer The drop id to remove
local function RemoveNearbyDrop(index)
    if not DropsNear[index] then return end

    local dropItem = DropsNear[index].object
    if DoesEntityExist(dropItem) then
        DeleteEntity(dropItem)
    end

    DropsNear[index] = nil

    if not Drops[index] then return end

    Drops[index].object = nil
    Drops[index].isDropShowing = nil
end

---Removes all drops in the area of the client
local function RemoveAllNearbyDrops()
    for k in pairs(DropsNear) do
        RemoveNearbyDrop(k)
    end
end

---Creates a new item drop object on the ground
---@param index integer The drop id to save the object in
local function CreateItemDrop(index)
    local dropItem = CreateObject(Config.ItemDropObject, DropsNear[index].coords.x, DropsNear[index].coords.y, DropsNear[index].coords.z, false, false, false)
    DropsNear[index].object = dropItem
    DropsNear[index].isDropShowing = true
    PlaceObjectOnGroundProperly(dropItem)
    FreezeEntityPosition(dropItem, true)
	if Config.UseTarget then
		exports['qb-target']:AddTargetEntity(dropItem, {
			options = {
				{
					icon = 'fas fa-backpack',
					label = Lang:t("menu.o_bag"),
					action = function()
						TriggerServerEvent("inventory:server:OpenInventory", "drop", index)
					end,
				}
			},
			distance = 2.5,
		})
	end
end

--#endregion Functions

--#region Events

RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
    LocalPlayer.state:set("inv_busy", false, true)
    PlayerData = QBCore.Functions.GetPlayerData()
    QBCore.Functions.TriggerCallback("inventory:server:GetCurrentDrops", function(theDrops)
		Drops = theDrops
    end)
end)

RegisterNetEvent('QBCore:Client:OnPlayerUnload', function()
    LocalPlayer.state:set("inv_busy", true, true)
    PlayerData = {}
    RemoveAllNearbyDrops()
end)

RegisterNetEvent('QBCore:Client:UpdateObject', function()
    QBCore = exports['qb-core']:GetCoreObject()
end)


RegisterNuiCallback("maske", function() ExecuteCommand("mask")end)
RegisterNuiCallback("brille", function() ExecuteCommand("glasses")end)
RegisterNuiCallback("uhr", function() ExecuteCommand("watch")end)
RegisterNuiCallback("ohrringe", function() ExecuteCommand("Ear")end)
RegisterNuiCallback("handschuhe", function() ExecuteCommand("gloves")end)
RegisterNuiCallback("kopf", function() ExecuteCommand("hat")end)
RegisterNuiCallback("shirts", function() ExecuteCommand("shirt")end)
RegisterNuiCallback("weste", function() ExecuteCommand("vest")end)
RegisterNuiCallback("unterteil", function() ExecuteCommand("pants")end)
RegisterNuiCallback("schuhe", function() ExecuteCommand("shoes")end)
RegisterNuiCallback("armor", function() ExecuteCommand("")end)
RegisterNuiCallback("bileklik", function() ExecuteCommand("Bracelet")end)
RegisterNuiCallback("rucksack", function() ExecuteCommand("Bag")end)

RegisterNetEvent('QBCore:Player:SetPlayerData', function(val)
    PlayerData = val
end)

AddEventHandler('onResourceStop', function(name)
    if name ~= GetCurrentResourceName() then return end
    if Config.UseItemDrop then RemoveAllNearbyDrops() end
    PedPreviewActive(false)
    TriggerScreenblurFadeOut(0)
end)

RegisterNetEvent("qb-inventory:client:closeinv", function()
    closeInventory()
    RemoveBag()
end)

RegisterNetEvent('inventory:client:CheckOpenState', function(type, id, label)
    local name = QBCore.Shared.SplitStr(label, "-")[2]
    if type == "stash" then
        if name ~= CurrentStash or CurrentStash == nil then
            TriggerServerEvent('inventory:server:SetIsOpenState', false, type, id)
        end
    elseif type == "trunk" then
        if name ~= CurrentVehicle or CurrentVehicle == nil then
            TriggerServerEvent('inventory:server:SetIsOpenState', false, type, id)
        end
    elseif type == "glovebox" then
        if name ~= CurrentGlovebox or CurrentGlovebox == nil then
            TriggerServerEvent('inventory:server:SetIsOpenState', false, type, id)
        end
    elseif type == "drop" then
        if name ~= CurrentDrop or CurrentDrop == nil then
            TriggerServerEvent('inventory:server:SetIsOpenState', false, type, id)
        end
    end
end)

RegisterNetEvent('inventory:client:ItemBox', function(itemData, type)
    SendNUIMessage({
        action = "itemBox",
        item = itemData,
        type = type
    })
end)

RegisterNetEvent('inventory:client:requiredItems', function(items, bool)
    local itemTable = {}
    if bool then
        for k in pairs(items) do
            itemTable[#itemTable+1] = {
                item = items[k].name,
                label = QBCore.Shared.Items[items[k].name]["label"],
                image = items[k].image,
            }
        end
    end

    SendNUIMessage({
        action = "requiredItem",
        items = itemTable,
        toggle = bool
    })
end)

RegisterNetEvent('inventory:server:RobPlayer', function(TargetId)
    SendNUIMessage({
        action = "RobMoney",
        TargetId = TargetId,
    })
end)

-- local boneNames = {
--     [31086] = "head",
--     [64729] = "left-arm",
--     [58271] = "left-arm",
--     [45454] = "right-arm", 
--     [18905] = "right-arm",
--     [11816] = "left-leg", 
--     [14201] = "left-leg", 
--     [51826] = "right-leg",
--     [52301] = "right-leg", 
--     [10706] = "spine",
-- }

local boneNames = {
    [31086] = "head",
    [45509] = "left-arm",
    [61163] = "left-arm",
    [28252] = "right-arm", 
    [40269] = "right-arm",
    [63931] = "left-leg", 
    [58271] = "left-leg", 
    [51826] = "right-leg",
    [36864] = "right-leg", 
    [24818] = "spine",
}
local function GetDamagedBonesTable(ped)
    local damagedBones = {}

    for boneId, boneName in pairs(boneNames) do
        local success, damagedBone = GetPedLastDamageBone(ped)
        if success and damagedBone == boneId then
            if not damagedBones[boneName] then
                damagedBones[boneName] = true
            end
        end
    end
    
    ClearEntityLastDamageEntity(ped) 

    return damagedBones
end

RegisterNetEvent('inventory:client:OpenInventory', function(PlayerAmmo, inventory, other)
    local PlayerPed = PlayerPedId()
      PutOnBag()
        Citizen.Wait(300)
        TriggerScreenblurFadeIn(0)
        local DamagedBones = GetDamagedBonesTable(PlayerPed)
        PedPreviewActive(true)
        ToggleHotbar(false)
        SetNuiFocus(true, true)

        if other then
            currentOtherInventory = other.name
        end
        SendNUIMessage({
            action = "open",
            inventory = inventory,
            slots = Config.MaxInventorySlots,
            other = other,
            DamagedBones = DamagedBones,
            maxweight = Config.MaxInventoryWeight,
            Ammo = PlayerAmmo,
            maxammo = Config.MaximumAmmoValues,
            Name = "" ..PlayerData.charinfo.firstname .." ".. PlayerData.charinfo.lastname .."",
            Jobname = PlayerData.job.name,
            Phone = PlayerData.charinfo.phone,
            Bank = PlayerData.money['bank'],
        })
        inInventory = tru
end)

RegisterNetEvent('inventory:client:UpdatePlayerInventory', function(isError)
    SendNUIMessage({
        action = "update",
        inventory = PlayerData.items,
        maxweight = Config.MaxInventoryWeight,
        slots = Config.MaxInventorySlots,
        error = isError,
    })
end)

RegisterNetEvent('inventory:client:CraftItems', function(itemName, itemCosts, amount, toSlot, points)
    local ped = PlayerPedId()
    SendNUIMessage({
        action = "close",
    })
    isCrafting = true
    QBCore.Functions.Progressbar("repair_vehicle", Lang:t("progress.crafting"), (math.random(2000, 5000) * amount), false, true, {
	    disableMovement = true,
	    disableCarMovement = true,
	    disableMouse = false,
	    disableCombat = true,
	}, {
	    animDict = "mini@repair",
	    anim = "fixing_a_player",
	    flags = 16,
	}, {}, {}, function() -- Done
	    StopAnimTask(ped, "mini@repair", "fixing_a_player", 1.0)
            TriggerServerEvent("inventory:server:CraftItems", itemName, itemCosts, amount, toSlot, points)
            TriggerEvent('inventory:client:ItemBox', QBCore.Shared.Items[itemName], 'add')
            isCrafting = false
	end, function() -- Cancel
	    StopAnimTask(ped, "mini@repair", "fixing_a_player", 1.0)
            QBCore.Functions.Notify(Lang:t("notify.failed"), "error")
            isCrafting = false
	end)
end)

RegisterNetEvent('inventory:client:CraftAttachment', function(itemName, itemCosts, amount, toSlot, points)
    local ped = PlayerPedId()
    SendNUIMessage({
        action = "close",
    })
    isCrafting = true
    QBCore.Functions.Progressbar("repair_vehicle", Lang:t("progress.crafting"), (math.random(2000, 5000) * amount), false, true, {
	    disableMovement = true,
	    disableCarMovement = true,
	    disableMouse = false,
	    disableCombat = true,
	}, {
	    animDict = "mini@repair",
	    anim = "fixing_a_player",
	    flags = 16,
	}, {}, {}, function() -- Done
	    StopAnimTask(ped, "mini@repair", "fixing_a_player", 1.0)
            TriggerServerEvent("inventory:server:CraftAttachment", itemName, itemCosts, amount, toSlot, points)
            TriggerEvent('inventory:client:ItemBox', QBCore.Shared.Items[itemName], 'add')
            isCrafting = false
	end, function() -- Cancel
	    StopAnimTask(ped, "mini@repair", "fixing_a_player", 1.0)
            QBCore.Functions.Notify(Lang:t("notify.failed"), "error")
            isCrafting = false
	end)
end)

RegisterNetEvent('inventory:client:PickupSnowballs', function()
    local ped = PlayerPedId()
    LoadAnimDict('anim@mp_snowball')
    TaskPlayAnim(ped, 'anim@mp_snowball', 'pickup_snowball', 3.0, 3.0, -1, 0, 1, 0, 0, 0)
    QBCore.Functions.Progressbar("pickupsnowball", Lang:t("progress.snowballs"), 1500, false, true, {
        disableMovement = true,
        disableCarMovement = true,
        disableMouse = false,
        disableCombat = true,
    }, {}, {}, {}, function() -- Done
        ClearPedTasks(ped)
	TriggerServerEvent('inventory:server:snowball', 'add')
        TriggerEvent('inventory:client:ItemBox', QBCore.Shared.Items["snowball"], "add")
    end, function() -- Cancel
        ClearPedTasks(ped)
        QBCore.Functions.Notify(Lang:t("notify.canceled"), "error")
    end)
end)

RegisterNetEvent('inventory:client:UseWeapon', function(weaponData, shootbool)
    local ped = PlayerPedId()
    local weaponName = tostring(weaponData.name)
    local weaponHash = joaat(weaponData.name)
    if currentWeapon == weaponName then
        SetCurrentPedWeapon(ped, `WEAPON_UNARMED`, true)
        RemoveAllPedWeapons(ped, true)
        TriggerEvent('weapons:client:SetCurrentWeapon', nil, shootbool)
        currentWeapon = nil
    elseif weaponName == "weapon_stickybomb" or weaponName == "weapon_pipebomb" or weaponName == "weapon_smokegrenade" or weaponName == "weapon_flare" or weaponName == "weapon_proxmine" or weaponName == "weapon_ball"  or weaponName == "weapon_molotov" or weaponName == "weapon_grenade" or weaponName == "weapon_bzgas" then
        GiveWeaponToPed(ped, weaponHash, 1, false, false)
        SetPedAmmo(ped, weaponHash, 1)
        SetCurrentPedWeapon(ped, weaponHash, true)
        TriggerEvent('weapons:client:SetCurrentWeapon', weaponData, shootbool)
        currentWeapon = weaponName
    elseif weaponName == "weapon_snowball" then
        GiveWeaponToPed(ped, weaponHash, 10, false, false)
        SetPedAmmo(ped, weaponHash, 10)
        SetCurrentPedWeapon(ped, weaponHash, true)
        TriggerServerEvent('inventory:server:snowball', 'remove')
        TriggerEvent('weapons:client:SetCurrentWeapon', weaponData, shootbool)
        currentWeapon = weaponName
    else
        TriggerEvent('weapons:client:SetCurrentWeapon', weaponData, shootbool)
        local ammo = tonumber(weaponData.info.ammo) or 0
		local tint = tonumber(weaponData.info.tint) or 0
        if weaponName == "weapon_petrolcan" then
            ammo = 4000
        end

        GiveWeaponToPed(ped, weaponHash, ammo, false, false)
        SetPedAmmo(ped, weaponHash, ammo)
        SetCurrentPedWeapon(ped, weaponHash, true)
		SetPedWeaponTintIndex(ped, weaponHash, tint)

        if weaponData.info.attachments then
            for _, attachment in pairs(weaponData.info.attachments) do
                GiveWeaponComponentToPed(ped, weaponHash, joaat(attachment.component))
            end
        end

        currentWeapon = weaponName
    end
end)

RegisterNetEvent('inventory:client:CheckWeapon', function(weaponName)
    if currentWeapon ~= weaponName:lower() then return end
    local ped = PlayerPedId()
    TriggerEvent('weapons:ResetHolster')
    SetCurrentPedWeapon(ped, `WEAPON_UNARMED`, true)
    RemoveAllPedWeapons(ped, true)
    currentWeapon = nil
end)

-- This needs to be changed to do a raycast so items arent placed in walls
RegisterNetEvent('inventory:client:AddDropItem', function(dropId, player, coords)
    local forward = GetEntityForwardVector(GetPlayerPed(GetPlayerFromServerId(player)))
    local x, y, z = table.unpack(coords + forward * 0.5)
    Drops[dropId] = {
        id = dropId,
        coords = {
            x = x,
            y = y,
            z = z - 0.3,
        },
    }
end)

RegisterNetEvent('inventory:client:RemoveDropItem', function(dropId)
    Drops[dropId] = nil
    if Config.UseItemDrop then
        RemoveNearbyDrop(dropId)
    else
        DropsNear[dropId] = nil
    end
end)

RegisterNetEvent('inventory:client:DropItemAnim', function()
    local ped = PlayerPedId()
    SendNUIMessage({
        action = "close",
    })
    LoadAnimDict("pickup_object")
    TaskPlayAnim(ped, "pickup_object" ,"pickup_low" ,8.0, -8.0, -1, 1, 0, false, false, false )
    Wait(2000)
    ClearPedTasks(ped)
end)

RegisterNetEvent('inventory:client:SetCurrentStash', function(stash)
    CurrentStash = stash
end)

RegisterNetEvent('qb-inventory:client:giveAnim', function()
    if IsPedInAnyVehicle(PlayerPedId(), false) then
	return
    else
	LoadAnimDict('mp_common')
	TaskPlayAnim(PlayerPedId(), 'mp_common', 'givetake1_b', 8.0, 1.0, -1, 16, 0, 0, 0, 0)
    end
end)

RegisterNetEvent('inventory:client:craftTarget',function()
    local crafting = {}
    crafting.label = Lang:t("label.craft")
    crafting.items = GetThresholdItems()
    TriggerServerEvent("inventory:server:OpenInventory", "crafting", math.random(1, 99), crafting)
end)

RegisterCommand('envfix', function()
    closeInventory()
end, false)

local cooldwon = false
RegisterCommand('inventory', function()
    if not isCrafting and not inInventory and not cooldwon then
        cooldwon = true

        SetTimeout(500, function()
            cooldwon = false
        end)
		
        if  not PlayerData.metadata["ishandcuffed"] and not IsPauseMenuActive() then
            local ped = PlayerPedId()
            local curVeh = nil
            local VendingMachine = nil
            if not Config.UseTarget then VendingMachine = GetClosestVending() end

            if IsPedInAnyVehicle(ped, false) then -- Is Player In Vehicle
                local vehicle = GetVehiclePedIsIn(ped, false)
                CurrentGlovebox = QBCore.Functions.GetPlate(vehicle)
                curVeh = vehicle
                CurrentVehicle = nil
            else
                local vehicle = QBCore.Functions.GetClosestVehicle()
                if vehicle ~= 0 and vehicle ~= nil then
                    local pos = GetEntityCoords(ped)
                    local dimensionMin, dimensionMax = GetModelDimensions(GetEntityModel(vehicle))
		    local trunkpos = GetOffsetFromEntityInWorldCoords(vehicle, 0.0, (dimensionMin.y), 0.0)
                    if (IsBackEngine(GetEntityModel(vehicle))) then
                        trunkpos = GetOffsetFromEntityInWorldCoords(vehicle, 0.0, (dimensionMax.y), 0.0)
                    end
                    if #(pos - trunkpos) < 1.5 and not IsPedInAnyVehicle(ped) then
                        if GetVehicleDoorLockStatus(vehicle) < 2 then
                            CurrentVehicle = QBCore.Functions.GetPlate(vehicle)
                            curVeh = vehicle
                            CurrentGlovebox = nil
                        else
                            QBCore.Functions.Notify(Lang:t("notify.vlocked"), "error")
                            return
                        end
                    else
                        CurrentVehicle = nil
                    end
                else
                    CurrentVehicle = nil
                end
            end

            if CurrentVehicle then -- Trunk
                local vehicleClass = GetVehicleClass(curVeh)
                local maxweight
                local slots
                if vehicleClass == 0 then
                    maxweight = 38000
                    slots = 30
                elseif vehicleClass == 1 then
                    maxweight = 50000
                    slots = 40
                elseif vehicleClass == 2 then
                    maxweight = 75000
                    slots = 50
                elseif vehicleClass == 3 then
                    maxweight = 42000
                    slots = 35
                elseif vehicleClass == 4 then
                    maxweight = 38000
                    slots = 30
                elseif vehicleClass == 5 then
                    maxweight = 30000
                    slots = 25
                elseif vehicleClass == 6 then
                    maxweight = 30000
                    slots = 25
                elseif vehicleClass == 7 then
                    maxweight = 30000
                    slots = 25
                elseif vehicleClass == 8 then
                    maxweight = 15000
                    slots = 15
                elseif vehicleClass == 9 then
                    maxweight = 60000
                    slots = 35
                elseif vehicleClass == 12 then
                    maxweight = 120000
                    slots = 35
                elseif vehicleClass == 13 then
                    maxweight = 0
                    slots = 0
                elseif vehicleClass == 14 then
                    maxweight = 120000
                    slots = 50
                elseif vehicleClass == 15 then
                    maxweight = 120000
                    slots = 50
                elseif vehicleClass == 16 then
                    maxweight = 120000
                    slots = 50
                else
                    maxweight = 60000
                    slots = 35
                end
                local other = {
                    maxweight = maxweight,
                    slots = slots,
                }
                TriggerServerEvent("inventory:server:OpenInventory", "trunk", CurrentVehicle, other)
                OpenTrunk()
            elseif CurrentGlovebox then
                TriggerServerEvent("inventory:server:OpenInventory", "glovebox", CurrentGlovebox)
            elseif CurrentDrop ~= 0 then
                TriggerServerEvent("inventory:server:OpenInventory", "drop", CurrentDrop)
            elseif VendingMachine then
                local ShopItems = {}
                ShopItems.label = "Vending Machine"
                ShopItems.items = Config.VendingItem
                ShopItems.slots = #Config.VendingItem
                TriggerServerEvent("inventory:server:OpenInventory", "shop", "Vendingshop_"..math.random(1, 99), ShopItems)
            else
                openAnim()
                TriggerServerEvent("inventory:server:OpenInventory")
            end
        end
    end
end, false)

RegisterKeyMapping('inventory', Lang:t("inf_mapping.opn_inv"), 'keyboard', Config.OpenInventory)

RegisterCommand('hotbar', function()
    isHotbar = not isHotbar
    local cashamount = PlayerData.money.cash
    local bankamount = PlayerData.money.bank --pashaaa
    if not PlayerData.metadata["isdead"] and not PlayerData.metadata["inlaststand"] and not PlayerData.metadata["ishandcuffed"] and not IsPauseMenuActive() then
        ToggleHotbar(isHotbar)
    end
    TriggerEvent('hud:client:ShowAccounts', 'cash', cashamount)
    TriggerEvent('hud:client:ShowAccounts', 'bank', bankamount)
end, false)

RegisterKeyMapping('hotbar', Lang:t("inf_mapping.tog_slots"), 'keyboard', Config.OpenHotbar)

for i = 1, 5 do
    RegisterCommand('slot' .. i,function()
    if LocalPlayer.state.Paintball then return end
        if not PlayerData.metadata["isdead"] and not PlayerData.metadata["inlaststand"] and not PlayerData.metadata["ishandcuffed"] and not IsPauseMenuActive() then
            if i == 6 then
                i = Config.MaxInventorySlots
            end
            TriggerServerEvent("inventory:server:UseItemSlot", i)
        end
    end, false)
    RegisterKeyMapping('slot' .. i, Lang:t("inf_mapping.use_item") .. i, 'keyboard', i)
end

--#endregion Commands

--#region NUI

RegisterNUICallback('RobMoney', function(data, cb)
    TriggerServerEvent("police:server:RobPlayer", data.TargetId)
    cb('ok')
end)

RegisterNUICallback('Notify', function(data, cb)
    QBCore.Functions.Notify(data.message, data.type)
    cb('ok')
end)

RegisterNUICallback('GetWeaponData', function(cData, cb)
    local data = {
        WeaponData = QBCore.Shared.Items[cData.weapon],
        AttachmentData = FormatWeaponAttachments(cData.ItemData)
    }
    cb(data)
end)

RegisterNUICallback('RemoveAttachment', function(data, cb)
    local ped = PlayerPedId()
    local WeaponData = QBCore.Shared.Items[data.WeaponData.name]
    local Attachment = WeaponAttachments[WeaponData.name:upper()][data.AttachmentData.attachment]
    QBCore.Functions.TriggerCallback('weapons:server:RemoveAttachment', function(NewAttachments)
        if NewAttachments ~= false then
            local Attachies = {}
            RemoveWeaponComponentFromPed(ped, joaat(data.WeaponData.name), joaat(Attachment.component))
            for _, v in pairs(NewAttachments) do
                for _, pew in pairs(WeaponAttachments[WeaponData.name:upper()]) do
                    if v.component == pew.component then
                        local item = pew.item
                        Attachies[#Attachies+1] = {
                            attachment = pew.item,
                            label = QBCore.Shared.Items[item].label,
                        }
                    end
                end
            end
            local DJATA = {
                Attachments = Attachies,
                WeaponData = WeaponData,
            }
            cb(DJATA)
        else
            RemoveWeaponComponentFromPed(ped, joaat(data.WeaponData.name), joaat(Attachment.component))
            cb({})
        end
    end, data.AttachmentData, data.WeaponData)
end)

RegisterNUICallback('getCombineItem', function(data, cb)
    cb(QBCore.Shared.Items[data.item])
end)

RegisterNUICallback("CloseInventory", function(_, cb)
    RemoveBag()
    PedPreviewActive(false)
    TriggerScreenblurFadeOut(0)
    if currentOtherInventory == "none-inv" then
        CurrentDrop = nil
        CurrentVehicle = nil
        CurrentGlovebox = nil
        CurrentStash = nil
        SetNuiFocus(false, false)
        inInventory = false
        ClearPedTasks(PlayerPedId())
        return
    end
    if CurrentVehicle ~= nil then
        CloseTrunk()
        TriggerServerEvent("inventory:server:SaveInventory", "trunk", CurrentVehicle)
        CurrentVehicle = nil
    elseif CurrentGlovebox ~= nil then
        TriggerServerEvent("inventory:server:SaveInventory", "glovebox", CurrentGlovebox)
        CurrentGlovebox = nil
    elseif CurrentStash ~= nil then
        TriggerServerEvent("inventory:server:SaveInventory", "stash", CurrentStash)
        CurrentStash = nil
    else
        TriggerServerEvent("inventory:server:SaveInventory", "drop", CurrentDrop)
        CurrentDrop = nil
    end
    SetNuiFocus(false, false)
    inInventory = false
    cb('ok')
end)

RegisterNUICallback("UseItem", function(data, cb)
    TriggerServerEvent("inventory:server:UseItem", data.inventory, data.item)
    cb('ok')
end)
RegisterNUICallback('PlaceItem', function(data, cb)
    local prop = QBCore.Shared.Items[data.item.name].prop

    TriggerEvent('qb-propplacing:client:placeProp', data.item, prop)
    cb('ok')
end)
RegisterNUICallback("combineItem", function(data, cb)
    Wait(150)
    TriggerServerEvent('inventory:server:combineItem', data.reward, data.fromItem, data.toItem)
    cb('ok')
end)

RegisterNUICallback('combineWithAnim', function(data, cb)
    local ped = PlayerPedId()
    local combineData = data.combineData
    local aDict = combineData.anim.dict
    local aLib = combineData.anim.lib
    local animText = combineData.anim.text
    local animTimeout = combineData.anim.timeOut
    QBCore.Functions.Progressbar("combine_anim", animText, animTimeout, false, true, {
        disableMovement = false,
        disableCarMovement = true,
        disableMouse = false,
        disableCombat = true,
    }, {
        animDict = aDict,
        anim = aLib,
        flags = 16,
    }, {}, {}, function() -- Done
        StopAnimTask(ped, aDict, aLib, 1.0)
        TriggerServerEvent('inventory:server:combineItem', combineData.reward, data.requiredItem, data.usedItem)
    end, function() -- Cancel
        StopAnimTask(ped, aDict, aLib, 1.0)
        QBCore.Functions.Notify(Lang:t("notify.failed"), "error")
    end)
    cb('ok')
end)

RegisterNUICallback("SetInventoryData", function(data, cb)
    if not exports['progressbar']:isDoingSomething() then
        TriggerServerEvent("inventory:server:SetInventoryData", data.fromInventory, data.toInventory, data.fromSlot, data.toSlot, data.fromAmount, data.toAmount)
        cb('ok')
    end
end)

RegisterNUICallback("PlayDropSound", function(_, cb)
    PlaySound(-1, "CLICK_BACK", "WEB_NAVIGATION_SOUNDS_PHONE", 0, 0, 1)
    cb('ok')
end)

RegisterNUICallback("PlayDropFail", function(_, cb)
    PlaySound(-1, "Place_Prop_Fail", "DLC_Dmod_Prop_Editor_Sounds", 0, 0, 1)
    cb('ok')
end)

RegisterNUICallback("GiveItem", function(data, cb)
    local player, distance = QBCore.Functions.GetClosestPlayer(GetEntityCoords(PlayerPedId()))
    if player ~= -1 and distance < 3 then
        if data.inventory == 'player' then
            local playerId = GetPlayerServerId(player)
            SetCurrentPedWeapon(PlayerPedId(),'WEAPON_UNARMED',true)
            TriggerServerEvent("inventory:server:GiveItem", playerId, data.item.name, data.amount, data.item.slot)
        else
            QBCore.Functions.Notify(Lang:t("notify.notowned"), "error")
        end
    else
        QBCore.Functions.Notify(Lang:t("notify.nonb"), "error")
    end
    cb('ok')
end)

--#endregion NUI

--#region Threads
CreateThread(function()
    while true do
        if inInventory then
            if exports['progressbar']:isDoingSomething() then
                closeInventory()
            end
        end
        Wait(1000)
    end
end)

CreateThread(function()
    while true do
        local sleep = 100
        if DropsNear ~= nil then
			local ped = PlayerPedId()
			local closestDrop = nil
			local closestDistance = nil
            for k, v in pairs(DropsNear) do

                if DropsNear[k] ~= nil then
                    if Config.UseItemDrop then
                        if not v.isDropShowing then
                            CreateItemDrop(k)
                        end
                    else
                        sleep = 0
                        DrawMarker(20, v.coords.x, v.coords.y, v.coords.z, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.3, 0.15, 120, 10, 20, 155, false, false, false, 1, false, false, false)
                    end

					local coords = (v.object ~= nil and GetEntityCoords(v.object)) or vector3(v.coords.x, v.coords.y, v.coords.z)
					local distance = #(GetEntityCoords(ped) - coords)
					if distance < 2 and (not closestDistance or distance < closestDistance) then
						closestDrop = k
						closestDistance = distance
					end
                end
            end


			if not closestDrop then
				CurrentDrop = 0
			else
				CurrentDrop = closestDrop
			end
        end
        Wait(sleep)
    end
end)

CreateThread(function()
    while true do
        if Drops ~= nil and next(Drops) ~= nil then
            local pos = GetEntityCoords(PlayerPedId(), true)
            for k, v in pairs(Drops) do
                if Drops[k] ~= nil then
                    local dist = #(pos - vector3(v.coords.x, v.coords.y, v.coords.z))
                    if dist < Config.MaxDropViewDistance then
                        DropsNear[k] = v
                    else
                        if Config.UseItemDrop and DropsNear[k] then
                            RemoveNearbyDrop(k)
                        else
                            DropsNear[k] = nil
                        end
                    end
                end
            end
        else
            DropsNear = {}
        end
        Wait(500)
    end
end)

CreateThread(function()
    if Config.UseTarget then
        exports['qb-target']:AddTargetModel(Config.VendingObjects, {
            options = {
                {
                    icon = "fa-solid fa-cash-register",
                    label = Lang:t("menu.vending"),
                    action = function()
                        OpenVending()
                    end
                },
            },
            distance = 2.5
        })
    end
end)

CreateThread(function()
    if Config.UseTarget then
        exports['qb-target']:AddTargetModel(Config.CraftingObject, {
            options = {
                {
                    event = "inventory:client:craftTarget",
                    icon = "fas fa-tools",
                    label = Lang:t("menu.craft"),
                },
            },
            distance = 2.5,
        })
    else
        while true do
            local sleep = 1000
            if LocalPlayer.state['isLoggedIn'] then
                local pos = GetEntityCoords(PlayerPedId())
                local craftObject = GetClosestObjectOfType(pos, 2.0, Config.CraftingObject, false, false, false)
                if craftObject ~= 0 then
                    local objectPos = GetEntityCoords(craftObject)
                    if #(pos - objectPos) < 1.5 then
                        sleep = 0
                        DrawText3Ds(objectPos.x, objectPos.y, objectPos.z + 1.0, Lang:t("interaction.craft"))
                        if IsControlJustReleased(0, 38) then
                            local crafting = {}
                            crafting.label = Lang:t("label.craft")
                            crafting.items = GetThresholdItems()
                            TriggerServerEvent("inventory:server:OpenInventory", "crafting", math.random(1, 99), crafting)
                            sleep = 100
                        end
                    end
                end
            end
            Wait(sleep)
        end
    end
end)

CreateThread(function()
    while true do
        local sleep = 1000
        if LocalPlayer.state['isLoggedIn'] then
            local pos = GetEntityCoords(PlayerPedId())
            local distance = #(pos - Config.AttachmentCraftingLocation)
            if distance < 10 then
                if distance < 1.5 then
                    sleep = 0
                    DrawText3Ds(Config.AttachmentCraftingLocation.x, Config.AttachmentCraftingLocation.y, Config.AttachmentCraftingLocation.z, Lang:t("interaction.craft"))
                    if IsControlJustPressed(0, 38) then
                        local crafting = {}
                        crafting.label = Lang:t("label.a_craft")
                        crafting.items = GetAttachmentThresholdItems()
                        TriggerServerEvent("inventory:server:OpenInventory", "attachment_crafting", math.random(1, 99), crafting)
                        sleep = 100
                    end
                end
            end
        end
        Wait(sleep)
    end
end)

--#endregion Threads


--#endregion Threads


local variations = {
	jackets = { male = {}, female = {} },
	hair = { male = {}, female = {} },
	bags = { male = {}, female = {} },
	visor = { male = {}, female = {} },
	gloves = {
		male = {
			[16] = 4,
			[17] = 4,
			[18] = 4,
			[19] = 0,
			[20] = 1,
			[21] = 2,
			[22] = 4,
			[23] = 5,
			[24] = 6,
			[25] = 8,
			[26] = 11,
			[27] = 12,
			[28] = 14,
			[29] = 15,
			[30] = 0,
			[31] = 1,
			[32] = 2,
			[33] = 4,
			[34] = 5,
			[35] = 6,
			[36] = 8,
			[37] = 11,
			[38] = 12,
			[39] = 14,
			[40] = 15,
			[41] = 0,
			[42] = 1,
			[43] = 2,
			[44] = 4,
			[45] = 5,
			[46] = 6,
			[47] = 8,
			[48] = 11,
			[49] = 12,
			[50] = 14,
			[51] = 15,
			[52] = 0,
			[53] = 1,
			[54] = 2,
			[55] = 4,
			[56] = 5,
			[57] = 6,
			[58] = 8,
			[59] = 11,
			[60] = 12,
			[61] = 14,
			[62] = 15,
			[63] = 0,
			[64] = 1,
			[65] = 2,
			[66] = 4,
			[67] = 5,
			[68] = 6,
			[69] = 8,
			[70] = 11,
			[71] = 12,
			[72] = 14,
			[73] = 15,
			[74] = 0,
			[75] = 1,
			[76] = 2,
			[77] = 4,
			[78] = 5,
			[79] = 6,
			[80] = 8,
			[81] = 11,
			[82] = 12,
			[83] = 14,
			[84] = 15,
			[85] = 0,
			[86] = 1,
			[87] = 2,
			[88] = 4,
			[89] = 5,
			[90] = 6,
			[91] = 8,
			[92] = 11,
			[93] = 12,
			[94] = 14,
			[95] = 15,
			[96] = 4,
			[97] = 4,
			[98] = 4,
			[99] = 0,
			[100] = 1,
			[101] = 2,
			[102] = 4,
			[103] = 5,
			[104] = 6,
			[105] = 8,
			[106] = 11,
			[107] = 12,
			[108] = 14,
			[109] = 15,
			[110] = 4,
			[111] = 4,
			[115] = 112,
			[116] = 112,
			[117] = 112,
			[118] = 112,
			[119] = 112,
			[120] = 112,
			[121] = 112,
			[122] = 113,
			[123] = 113,
			[124] = 113,
			[125] = 113,
			[126] = 113,
			[127] = 113,
			[128] = 113,
			[129] = 114,
			[130] = 114,
			[131] = 114,
			[132] = 114,
			[133] = 114,
			[134] = 114,
			[135] = 114,
			[136] = 15,
			[137] = 15,
			[138] = 0,
			[139] = 1,
			[140] = 2,
			[141] = 4,
			[142] = 5,
			[143] = 6,
			[144] = 8,
			[145] = 11,
			[146] = 12,
			[147] = 14,
			[148] = 112,
			[149] = 113,
			[150] = 114,
			[151] = 0,
			[152] = 1,
			[153] = 2,
			[154] = 4,
			[155] = 5,
			[156] = 6,
			[157] = 8,
			[158] = 11,
			[159] = 12,
			[160] = 14,
			[161] = 112,
			[162] = 113,
			[163] = 114,
			[165] = 4,
			[166] = 4,
			[167] = 4,
			[168] = 4,
			[170] = 15,
			[171] = 0,
			[172] = 1,
			[173] = 2,
			[174] = 4,
			[175] = 5,
			[176] = 6,
			[177] = 8,
			[178] = 11,
			[179] = 12,
			[180] = 14,
			[181] = 112,
			[182] = 113,
			[183] = 114,
			[185] = 184,
			[186] = 184,
			[187] = 184,
			[188] = 184,
			[189] = 185,
			[190] = 184,
			[191] = 184,
			[192] = 184,
			[193] = 184,
			[194] = 184,
		},
		female = {
			[16] = 11,
			[17] = 3,
			[18] = 3,
			[19] = 3,
			[20] = 0,
			[21] = 1,
			[22] = 2,
			[23] = 3,
			[24] = 4,
			[25] = 5,
			[26] = 6,
			[27] = 7,
			[28] = 9,
			[29] = 11,
			[30] = 12,
			[31] = 14,
			[32] = 15,
			[33] = 0,
			[34] = 1,
			[35] = 2,
			[36] = 3,
			[37] = 4,
			[38] = 5,
			[39] = 6,
			[40] = 7,
			[41] = 9,
			[42] = 11,
			[43] = 12,
			[44] = 14,
			[45] = 15,
			[46] = 0,
			[47] = 1,
			[48] = 2,
			[49] = 3,
			[50] = 4,
			[51] = 5,
			[52] = 6,
			[53] = 7,
			[54] = 9,
			[55] = 11,
			[56] = 12,
			[57] = 14,
			[58] = 15,
			[59] = 0,
			[60] = 1,
			[61] = 2,
			[62] = 3,
			[63] = 4,
			[64] = 5,
			[65] = 6,
			[66] = 7,
			[67] = 9,
			[68] = 11,
			[69] = 12,
			[70] = 14,
			[71] = 15,
			[72] = 0,
			[73] = 1,
			[74] = 2,
			[75] = 3,
			[76] = 4,
			[77] = 5,
			[78] = 6,
			[79] = 7,
			[80] = 9,
			[81] = 11,
			[82] = 12,
			[83] = 14,
			[84] = 15,
			[85] = 0,
			[86] = 1,
			[87] = 2,
			[88] = 3,
			[89] = 4,
			[90] = 5,
			[91] = 6,
			[92] = 7,
			[93] = 9,
			[94] = 11,
			[95] = 12,
			[96] = 14,
			[97] = 15,
			[98] = 0,
			[99] = 1,
			[100] = 2,
			[101] = 3,
			[102] = 4,
			[103] = 5,
			[104] = 6,
			[105] = 7,
			[106] = 9,
			[107] = 11,
			[108] = 12,
			[109] = 14,
			[110] = 15,
			[111] = 3,
			[112] = 3,
			[113] = 3,
			[114] = 0,
			[115] = 1,
			[116] = 2,
			[117] = 3,
			[118] = 4,
			[119] = 5,
			[120] = 6,
			[121] = 7,
			[122] = 9,
			[123] = 11,
			[124] = 12,
			[125] = 14,
			[126] = 15,
			[127] = 3,
			[128] = 3,
			[132] = 129,
			[133] = 129,
			[134] = 129,
			[135] = 129,
			[136] = 129,
			[137] = 129,
			[138] = 129,
			[139] = 130,
			[140] = 130,
			[141] = 130,
			[142] = 130,
			[143] = 130,
			[144] = 130,
			[145] = 130,
			[146] = 131,
			[147] = 131,
			[148] = 131,
			[149] = 131,
			[150] = 131,
			[151] = 131,
			[152] = 131,
			[154] = 153,
			[155] = 153,
			[156] = 153,
			[157] = 153,
			[158] = 153,
			[159] = 153,
			[160] = 153,
			[162] = 161,
			[163] = 161,
			[164] = 161,
			[165] = 161,
			[166] = 161,
			[167] = 161,
			[168] = 161,
			[169] = 15,
			[170] = 15,
			[171] = 0,
			[172] = 1,
			[173] = 2,
			[174] = 3,
			[175] = 4,
			[176] = 5,
			[177] = 6,
			[178] = 7,
			[179] = 9,
			[180] = 11,
			[181] = 12,
			[182] = 14,
			[183] = 129,
			[184] = 130,
			[185] = 131,
			[186] = 153,
			[187] = 0,
			[188] = 1,
			[189] = 2,
			[190] = 3,
			[191] = 4,
			[192] = 5,
			[193] = 6,
			[194] = 7,
			[195] = 9,
			[196] = 11,
			[197] = 12,
			[198] = 14,
			[199] = 129,
			[200] = 130,
			[201] = 131,
			[202] = 153,
			[203] = 161,
			[204] = 161,
			[206] = 3,
			[207] = 3,
			[208] = 3,
			[209] = 3,
			[211] = 15,
			[212] = 0,
			[213] = 1,
			[214] = 2,
			[215] = 3,
			[216] = 4,
			[217] = 5,
			[218] = 6,
			[219] = 7,
			[220] = 9,
			[221] = 11,
			[222] = 12,
			[223] = 14,
			[224] = 129,
			[225] = 130,
			[226] = 131,
			[227] = 153,
			[228] = 161,
			[230] = 229,
			[231] = 229,
			[232] = 229,
			[233] = 229,
			[234] = 229,
			[235] = 229,
			[236] = 229,
			[237] = 229,
			[238] = 229,
			[239] = 229,
		}
	}
}

local function addNewVariation(which, gender, one, two, single)
	local where = variations[which][gender]
	if not single then
		where[one] = two
		where[two] = one
	else
		where[one] = two
	end
end

CreateThread(function()
	-- male visor/Hat variations
	addNewVariation('visor', 'male', 9, 10)
	addNewVariation('visor', 'male', 18, 67)
	addNewVariation('visor', 'male', 82, 67)
	addNewVariation('visor', 'male', 44, 45)
	addNewVariation('visor', 'male', 50, 68)
	addNewVariation('visor', 'male', 51, 69)
	addNewVariation('visor', 'male', 52, 70)
	addNewVariation('visor', 'male', 53, 71)
	addNewVariation('visor', 'male', 62, 72)
	addNewVariation('visor', 'male', 65, 66)
	addNewVariation('visor', 'male', 73, 74)
	addNewVariation('visor', 'male', 76, 77)
	addNewVariation('visor', 'male', 79, 78)
	addNewVariation('visor', 'male', 80, 81)
	addNewVariation('visor', 'male', 91, 92)
	addNewVariation('visor', 'male', 104, 105)
	addNewVariation('visor', 'male', 109, 110)
	addNewVariation('visor', 'male', 116, 117)
	addNewVariation('visor', 'male', 118, 119)
	addNewVariation('visor', 'male', 123, 124)
	addNewVariation('visor', 'male', 125, 126)
	addNewVariation('visor', 'male', 127, 128)
	addNewVariation('visor', 'male', 130, 131)
	addNewVariation('visor', 'male', 135, 136)
	addNewVariation('visor', 'male', 137, 138)
	addNewVariation('visor', 'male', 139, 140)
	addNewVariation('visor', 'male', 142, 143)
	addNewVariation('visor', 'male', 147, 148)
	addNewVariation('visor', 'male', 151, 152)
	addNewVariation('visor', 'male', 127, 128)
	addNewVariation('visor', 'male', 130, 131)
	-- female visor/Hat variations
	addNewVariation('visor', 'female', 43, 44)
	addNewVariation('visor', 'female', 49, 67)
	addNewVariation('visor', 'female', 64, 65)
	addNewVariation('visor', 'female', 65, 64)
	addNewVariation('visor', 'female', 51, 69)
	addNewVariation('visor', 'female', 50, 68)
	addNewVariation('visor', 'female', 52, 70)
	addNewVariation('visor', 'female', 62, 71)
	addNewVariation('visor', 'female', 72, 73)
	addNewVariation('visor', 'female', 75, 76)
	addNewVariation('visor', 'female', 78, 77)
	addNewVariation('visor', 'female', 79, 80)
	addNewVariation('visor', 'female', 18, 66)
	addNewVariation('visor', 'female', 66, 81)
	addNewVariation('visor', 'female', 81, 66)
	addNewVariation('visor', 'female', 86, 84)
	addNewVariation('visor', 'female', 90, 91)
	addNewVariation('visor', 'female', 103, 104)
	addNewVariation('visor', 'female', 108, 109)
	addNewVariation('visor', 'female', 115, 116)
	addNewVariation('visor', 'female', 117, 118)
	addNewVariation('visor', 'female', 122, 123)
	addNewVariation('visor', 'female', 124, 125)
	addNewVariation('visor', 'female', 126, 127)
	addNewVariation('visor', 'female', 129, 130)
	addNewVariation('visor', 'female', 134, 135)
	addNewVariation('visor', 'female', 136, 137)
	addNewVariation('visor', 'female', 138, 139)
	addNewVariation('visor', 'female', 141, 142)
	addNewVariation('visor', 'female', 146, 147)
	addNewVariation('visor', 'female', 150, 151)
	-- male bags
	addNewVariation('bags', 'male', 45, 44)
	addNewVariation('bags', 'male', 41, 40)
	addNewVariation('bags', 'male', 82, 81)
	addNewVariation('bags', 'male', 86, 85)
	-- female bags
	addNewVariation('bags', 'female', 45, 44)
	addNewVariation('bags', 'female', 41, 40)
	addNewVariation('bags', 'female', 82, 81)
	addNewVariation('bags', 'female', 86, 85)
	-- male hair
	addNewVariation('hair', 'male', 7, 15, true)
	addNewVariation('hair', 'male', 43, 15, true)
	addNewVariation('hair', 'male', 9, 43, true)
	addNewVariation('hair', 'male', 11, 43, true)
	addNewVariation('hair', 'male', 15, 43, true)
	addNewVariation('hair', 'male', 16, 43, true)
	addNewVariation('hair', 'male', 17, 43, true)
	addNewVariation('hair', 'male', 20, 43, true)
	addNewVariation('hair', 'male', 22, 43, true)
	addNewVariation('hair', 'male', 45, 43, true)
	addNewVariation('hair', 'male', 47, 43, true)
	addNewVariation('hair', 'male', 49, 43, true)
	addNewVariation('hair', 'male', 51, 43, true)
	addNewVariation('hair', 'male', 52, 43, true)
	addNewVariation('hair', 'male', 53, 43, true)
	addNewVariation('hair', 'male', 56, 43, true)
	addNewVariation('hair', 'male', 58, 43, true)
	-- female hair
	addNewVariation('hair', 'female', 1, 49, true)
	addNewVariation('hair', 'female', 2, 49, true)
	addNewVariation('hair', 'female', 7, 49, true)
	addNewVariation('hair', 'female', 9, 49, true)
	addNewVariation('hair', 'female', 10, 49, true)
	addNewVariation('hair', 'female', 11, 48, true)
	addNewVariation('hair', 'female', 14, 53, true)
	addNewVariation('hair', 'female', 15, 42, true)
	addNewVariation('hair', 'female', 21, 42, true)
	addNewVariation('hair', 'female', 23, 42, true)
	addNewVariation('hair', 'female', 31, 53, true)
	addNewVariation('hair', 'female', 39, 49, true)
	addNewVariation('hair', 'female', 40, 49, true)
	addNewVariation('hair', 'female', 42, 53, true)
	addNewVariation('hair', 'female', 45, 49, true)
	addNewVariation('hair', 'female', 48, 49, true)
	addNewVariation('hair', 'female', 49, 48, true)
	addNewVariation('hair', 'female', 52, 53, true)
	addNewVariation('hair', 'female', 53, 42, true)
	addNewVariation('hair', 'female', 54, 55, true)
	addNewVariation('hair', 'female', 59, 42, true)
	addNewVariation('hair', 'female', 59, 54, true)
	addNewVariation('hair', 'female', 68, 53, true)
	addNewVariation('hair', 'female', 76, 48, true)
	-- male Top/Jacket variations
	addNewVariation('jackets', 'male', 29, 30)
	addNewVariation('jackets', 'male', 31, 32)
	addNewVariation('jackets', 'male', 42, 43)
	addNewVariation('jackets', 'male', 59, 60)
	addNewVariation('jackets', 'male', 68, 69)
	addNewVariation('jackets', 'male', 74, 75)
	addNewVariation('jackets', 'male', 87, 88)
	addNewVariation('jackets', 'male', 93, 94)
	addNewVariation('jackets', 'male', 99, 100)
	addNewVariation('jackets', 'male', 101, 102)
	addNewVariation('jackets', 'male', 103, 104)
	addNewVariation('jackets', 'male', 126, 127)
	addNewVariation('jackets', 'male', 129, 130)
	addNewVariation('jackets', 'male', 131, 132)
	addNewVariation('jackets', 'male', 184, 185)
	addNewVariation('jackets', 'male', 188, 189)
	addNewVariation('jackets', 'male', 194, 195)
	addNewVariation('jackets', 'male', 196, 197)
	addNewVariation('jackets', 'male', 198, 199)
	addNewVariation('jackets', 'male', 200, 203)
	addNewVariation('jackets', 'male', 202, 205)
	addNewVariation('jackets', 'male', 206, 207)
	addNewVariation('jackets', 'male', 209, 212)
	addNewVariation('jackets', 'male', 210, 211)
	addNewVariation('jackets', 'male', 217, 218)
	addNewVariation('jackets', 'male', 229, 230)
	addNewVariation('jackets', 'male', 232, 233)
	addNewVariation('jackets', 'male', 235, 236)
	addNewVariation('jackets', 'male', 241, 242)
	addNewVariation('jackets', 'male', 251, 253)
	addNewVariation('jackets', 'male', 256, 261)
	addNewVariation('jackets', 'male', 262, 263)
	addNewVariation('jackets', 'male', 265, 266)
	addNewVariation('jackets', 'male', 267, 268)
	addNewVariation('jackets', 'male', 279, 280)
	addNewVariation('jackets', 'male', 292, 293)
	addNewVariation('jackets', 'male', 294, 295)
	addNewVariation('jackets', 'male', 296, 297)
	addNewVariation('jackets', 'male', 300, 303)
	addNewVariation('jackets', 'male', 301, 302)
	addNewVariation('jackets', 'male', 305, 306)
	addNewVariation('jackets', 'male', 311, 312)
	addNewVariation('jackets', 'male', 300, 303)
	addNewVariation('jackets', 'male', 301, 302)
	addNewVariation('jackets', 'male', 305, 306)
	addNewVariation('jackets', 'male', 311, 312)
	addNewVariation('jackets', 'male', 314, 315)
	addNewVariation('jackets', 'male', 316, 317)
	addNewVariation('jackets', 'male', 318, 319)
	addNewVariation('jackets', 'male', 321, 322)
	addNewVariation('jackets', 'male', 330, 331)
	addNewVariation('jackets', 'male', 336, 337)
	addNewVariation('jackets', 'male', 339, 126)
	addNewVariation('jackets', 'male', 340, 341)
	addNewVariation('jackets', 'male', 343, 344)
	addNewVariation('jackets', 'male', 346, 234)
	addNewVariation('jackets', 'male', 347, 260)
	addNewVariation('jackets', 'male', 348, 349)
	addNewVariation('jackets', 'male', 352, 353)
	addNewVariation('jackets', 'male', 354, 355)
	addNewVariation('jackets', 'male', 359, 360)
	-- female Top/Jacket variations
	addNewVariation('jackets', 'female', 53, 52)
	addNewVariation('jackets', 'female', 57, 58)
	addNewVariation('jackets', 'female', 62, 63)
	addNewVariation('jackets', 'female', 84, 85)
	addNewVariation('jackets', 'female', 90, 91)
	addNewVariation('jackets', 'female', 92, 93)
	addNewVariation('jackets', 'female', 94, 95)
	addNewVariation('jackets', 'female', 117, 118)
	addNewVariation('jackets', 'female', 120, 121)
	addNewVariation('jackets', 'female', 128, 129)
	addNewVariation('jackets', 'female', 187, 186)
	addNewVariation('jackets', 'female', 190, 191)
	addNewVariation('jackets', 'female', 196, 197)
	addNewVariation('jackets', 'female', 198, 199)
	addNewVariation('jackets', 'female', 200, 201)
	addNewVariation('jackets', 'female', 202, 205)
	addNewVariation('jackets', 'female', 204, 207)
	addNewVariation('jackets', 'female', 210, 211)
	addNewVariation('jackets', 'female', 213, 216)
	addNewVariation('jackets', 'female', 214, 215)
	addNewVariation('jackets', 'female', 225, 226)
	addNewVariation('jackets', 'female', 227, 228)
	addNewVariation('jackets', 'female', 239, 240)
	addNewVariation('jackets', 'female', 242, 243)
	addNewVariation('jackets', 'female', 244, 364)
	addNewVariation('jackets', 'female', 245, 246)
	addNewVariation('jackets', 'female', 249, 250)
	addNewVariation('jackets', 'female', 259, 261)
	addNewVariation('jackets', 'female', 265, 270)
	addNewVariation('jackets', 'female', 271, 272)
	addNewVariation('jackets', 'female', 274, 275)
	addNewVariation('jackets', 'female', 276, 277)
	addNewVariation('jackets', 'female', 280, 281)
	addNewVariation('jackets', 'female', 292, 293)
	addNewVariation('jackets', 'female', 305, 306)
	addNewVariation('jackets', 'female', 307, 308)
	addNewVariation('jackets', 'female', 311, 314)
	addNewVariation('jackets', 'female', 312, 313)
	addNewVariation('jackets', 'female', 316, 317)
	addNewVariation('jackets', 'female', 325, 326)
	addNewVariation('jackets', 'female', 327, 328)
	addNewVariation('jackets', 'female', 329, 330)
	addNewVariation('jackets', 'female', 332, 333)
	addNewVariation('jackets', 'female', 339, 340)
	addNewVariation('jackets', 'female', 345, 346)
	addNewVariation('jackets', 'female', 351, 352)
	addNewVariation('jackets', 'female', 354, 121)
	addNewVariation('jackets', 'female', 355, 356)
	addNewVariation('jackets', 'female', 357, 359)
	addNewVariation('jackets', 'female', 358, 360)
	addNewVariation('jackets', 'female', 362, 363)
	addNewVariation('jackets', 'female', 366, 367)
	addNewVariation('jackets', 'female', 365, 269)
	addNewVariation('jackets', 'female', 370, 371)
	addNewVariation('jackets', 'female', 372, 373)
	addNewVariation('jackets', 'female', 378, 379)
end)

local drawables = {
	['Top'] = {
		Drawable = 11,
		Table = variations.jackets,
		Emote = { Dict = 'missmic4', Anim = 'michael_tux_fidget', Move = 51, Dur = 1500 }
	},
	['gloves'] = {
		Drawable = 3,
		Table = variations.gloves,
		Remember = true,
		Emote = { Dict = 'nmt_3_rcm-10', Anim = 'cs_nigel_dual-10', Move = 51, Dur = 1200 }
	},
	['Shoes'] = {
		Drawable = 6,
		Table = { Standalone = true, male = 34, female = 35 },
		Emote = { Dict = 'random@domestic', Anim = 'pickup_low', Move = 0, Dur = 1200 }
	},
	['Neck'] = {
		Drawable = 7,
		Table = { Standalone = true, male = 0, female = 0 },
		Emote = { Dict = 'clothingtie', Anim = 'try_tie_positive_a', Move = 51, Dur = 2100 }
	},
	['Vest'] = {
		Drawable = 9,
		Table = { Standalone = true, male = 0, female = 0 },
		Emote = { Dict = 'clothingtie', Anim = 'try_tie_negative_a', Move = 51, Dur = 1200 }
	},
	['Bag'] = {
		Drawable = 5,
		Table = variations.bags,
		Emote = { Dict = 'anim@heists@ornate_bank@grab_cash', Anim = 'intro', Move = 51, Dur = 1600 }
	},
	['Mask'] = {
		Drawable = 1,
		Table = { Standalone = true, male = 0, female = 0 },
		Emote = { Dict = 'mp_masks@standard_car@ds@', Anim = 'put_on_mask', Move = 51, Dur = 800 }
	},
	['hair'] = {
		Drawable = 2,
		Table = variations.hair,
		Remember = true,
		Emote = { Dict = 'clothingtie', Anim = 'check_out_a', Move = 51, Dur = 2000 }
	},
}

local Extras = {
	['Shirt'] = {
		Drawable = 11,
		Table = {
			Standalone = true,
			male = 252,
			female = 74,
			Extra = {
				{ Drawable = 8,  Id = 15, Tex = 0, Name = 'Extra Undershirt' },
				{ Drawable = 3,  Id = 15, Tex = 0, Name = 'Extra Gloves' },
				{ Drawable = 10, Id = 0,  Tex = 0, Name = 'Extra Decals' },
			}
		},
		Emote = { Dict = 'clothingtie', Anim = 'try_tie_negative_a', Move = 51, Dur = 1200 }
	},
	['Pants'] = {
		Drawable = 4,
		Table = { Standalone = true, male = 61, female = 14 },
		Emote = { Dict = 're@construction', Anim = 'out_of_breath', Move = 51, Dur = 1300 }
	},
	['Bagoff'] = {
		Drawable = 5,
		Table = { Standalone = true, male = 0, female = 0 },
		Emote = { Dict = 'clothingtie', Anim = 'try_tie_negative_a', Move = 51, Dur = 1200 }
	},
}

local Props = {
	['visor'] = {
		Prop = 0,
		Variants = variations.visor,
		Emote = {
			On = { Dict = 'mp_masks@standard_car@ds@', Anim = 'put_on_mask', Move = 51, Dur = 600 },
			Off = { Dict = 'missheist_agency2ahelmet', Anim = 'take_off_helmet_stand', Move = 51, Dur = 1200 }
		}
	},
	['Hat'] = {
		Prop = 0,
		Emote = {
			On = { Dict = 'mp_masks@standard_car@ds@', Anim = 'put_on_mask', Move = 51, Dur = 600 },
			Off = { Dict = 'missheist_agency2ahelmet', Anim = 'take_off_helmet_stand', Move = 51, Dur = 1200 }
		}
	},
	['Glasses'] = {
		Prop = 1,
		Emote = {
			On = { Dict = 'clothingspecs', Anim = 'take_off', Move = 51, Dur = 1400 },
			Off = { Dict = 'clothingspecs', Anim = 'take_off', Move = 51, Dur = 1400 }
		}
	},
	['Ear'] = {
		Prop = 2,
		Emote = {
			On = { Dict = 'mp_cp_stolen_tut', Anim = 'b_think', Move = 51, Dur = 900 },
			Off = { Dict = 'mp_cp_stolen_tut', Anim = 'b_think', Move = 51, Dur = 900 }
		}
	},
	['Watch'] = {
		Prop = 6,
		Emote = {
			On = { Dict = 'nmt_3_rcm-10', Anim = 'cs_nigel_dual-10', Move = 51, Dur = 1200 },
			Off = { Dict = 'nmt_3_rcm-10', Anim = 'cs_nigel_dual-10', Move = 51, Dur = 1200 }
		}
	},
	['Bracelet'] = {
		Prop = 7,
		Emote = {
			On = { Dict = 'nmt_3_rcm-10', Anim = 'cs_nigel_dual-10', Move = 51, Dur = 1200 },
			Off = { Dict = 'nmt_3_rcm-10', Anim = 'cs_nigel_dual-10', Move = 51, Dur = 1200 }
		}
	},
}

LastEquipped = {}
Cooldown = false

local function PlayToggleEmote(e, cb)
	local Ped = PlayerPedId()
	while not HasAnimDictLoaded(e.Dict) do
		RequestAnimDict(e.Dict)
		Wait(100)
	end
	if IsPedInAnyVehicle(Ped) then e.Move = 51 end
	TaskPlayAnim(Ped, e.Dict, e.Anim, 3.0, 3.0, e.Dur, e.Move, 0, false, false, false)
	local Pause = e.Dur - 500
	if Pause < 500 then Pause = 500 end
	IncurCooldown(Pause)
	Wait(Pause) -- Lets wait for the emote to play for a bit then do the callback.
	cb()
end

function ResetClothing(anim)
	if type(anim) == 'table' then
		anim = true
	end
	local Ped = PlayerPedId()
	local e = drawables.Top.Emote
	if anim then TaskPlayAnim(Ped, e.Dict, e.Anim, 3.0, 3.0, 3000, e.Move, 0, false, false, false) end
	for _, v in pairs(LastEquipped) do
		if v then
			if v.Drawable then
				SetPedComponentVariation(Ped, v.Id, v.Drawable, v.Texture, 0)
			elseif v.Prop then
				ClearPedProp(Ped, v.Id)
				SetPedPropIndex(Ped, v.Id, v.Prop, v.Texture, true)
			end
		end
	end
	LastEquipped = {}
end

RegisterNetEvent('qb-radialmenu:ResetClothing', ResetClothing)

function ToggleClothing(whic, extra)
	local which = whic
	if type(whic) == 'table' then
		which = tostring(whic.id)
	end
	Wait(50)

	if which == 'Shirt' or which == 'Pants' or which == 'Bagoff' then
		extra = true
	end
	if Cooldown then return end
	local Toggle = drawables[which]
	if extra then Toggle = Extras[which] end
	local Ped = PlayerPedId()
	local Cur = { -- Lets check what we are currently wearing.
		Drawable = GetPedDrawableVariation(Ped, Toggle.Drawable),
		Id = Toggle.Drawable,
		Ped = Ped,
		Texture = GetPedTextureVariation(Ped, Toggle.Drawable),
	}
	local Gender = IsMpPed(Ped)
	if which ~= 'Mask' then
		if not Gender then
			return false
		end                                                            -- We cancel the command here if the person is not using a multiplayer model.
	end
	local Table = Toggle.Table[Gender]
	if not Toggle.Table.Standalone then -- "Standalone" is for things that dont require a variant, like the shoes just need to be switched to a specific drawable. Looking back at this i should have planned ahead, but it all works so, meh!
		for k, v in pairs(Table) do
			if not Toggle.Remember then
				if k == Cur.Drawable then
					PlayToggleEmote(Toggle.Emote, function() SetPedComponentVariation(Ped, Toggle.Drawable, v, Cur.Texture, 0) end)
					return true
				end
			else
				if not LastEquipped[which] then
					if k == Cur.Drawable then
						PlayToggleEmote(Toggle.Emote, function()
							LastEquipped[which] = Cur
							SetPedComponentVariation(Ped, Toggle.Drawable, v, Cur.Texture, 0)
						end)
						return true
					end
				else
					local Last = LastEquipped[which]
					PlayToggleEmote(Toggle.Emote, function()
						SetPedComponentVariation(Ped, Toggle.Drawable, Last.Drawable, Last.Texture, 0)
						LastEquipped[which] = false
					end)
					return true
				end
			end
		end
		return
	else
		if not LastEquipped[which] then
			if Cur.Drawable ~= Table then
				PlayToggleEmote(Toggle.Emote, function()
					LastEquipped[which] = Cur
					SetPedComponentVariation(Ped, Toggle.Drawable, Table, 0, 0)
					if Toggle.Table.Extra then
						local extraToggled = Toggle.Table.Extra
						for _, v in pairs(extraToggled) do
							local ExtraCur = { Drawable = GetPedDrawableVariation(Ped, v.Drawable), Texture = GetPedTextureVariation(Ped, v.Drawable), Id = v.Drawable }
							SetPedComponentVariation(Ped, v.Drawable, v.Id, v.Tex, 0)
							LastEquipped[v.Name] = ExtraCur
						end
					end
				end)
				return true
			end
		else
			local Last = LastEquipped[which]
			PlayToggleEmote(Toggle.Emote, function()
				SetPedComponentVariation(Ped, Toggle.Drawable, Last.Drawable, Last.Texture, 0)
				LastEquipped[which] = false
				if Toggle.Table.Extra then
					local extraToggled = Toggle.Table.Extra
					for _, v in pairs(extraToggled) do
						if LastEquipped[v.Name] then
							Last = LastEquipped[v.Name]
							SetPedComponentVariation(Ped, Last.Id, Last.Drawable, Last.Texture, 0)
							LastEquipped[v.Name] = false
						end
					end
				end
			end)
			return true
		end
	end
	return false
end

RegisterNetEvent('qb-radialmenu:ToggleClothing', ToggleClothing)

function ToggleProps(whic)
	local which = whic
	if type(whic) == 'table' then
		which = tostring(whic.id)
	end
	Wait(50)

	if Cooldown then return end
	local Prop = Props[which]
	local Ped = PlayerPedId()
	local Cur = { -- Lets get out currently equipped prop.
		Id = Prop.Prop,
		Ped = Ped,
		Prop = GetPedPropIndex(Ped, Prop.Prop),
		Texture = GetPedPropTextureIndex(Ped, Prop.Prop),
	}
	if not Prop.Variants then
		if Cur.Prop ~= -1 then -- If we currently are wearing this prop, remove it and save the one we were wearing into the LastEquipped table.
			PlayToggleEmote(Prop.Emote.Off, function()
				LastEquipped[which] = Cur
				ClearPedProp(Ped, Prop.Prop)
			end)
			return true
		else
			local Last = LastEquipped[which] -- Detect that we have already taken our prop off, lets put it back on.
			if Last then
				PlayToggleEmote(Prop.Emote.On, function() SetPedPropIndex(Ped, Prop.Prop, Last.Prop, Last.Texture, true) end)
				LastEquipped[which] = false
				return true
			end
		end
		return false
	else
		local Gender = IsMpPed(Ped)
		if not Gender then
			Notify(Lang:t('info.wrong_ped'))
			return false
		end                                                            -- We dont really allow for variants on ped models, Its possible, but im pretty sure 95% of ped models dont really have variants.
		variations = Prop.Variants[Gender]
		for k, v in pairs(variations) do
			if Cur.Prop == k then
				PlayToggleEmote(Prop.Emote.On, function() SetPedPropIndex(Ped, Prop.Prop, v, Cur.Texture, true) end)
				return true
			end
		end
		return false
	end
end

RegisterNetEvent('qb-radialmenu:ToggleProps', ToggleProps)

for k, v in pairs(Config.Commands) do
	RegisterCommand(k, v.Func)
	--log("Created /"..k.." ("..v.Desc..")") -- Useful for translation checking.
	TriggerEvent('chat:addSuggestion', '/' .. k, v.Desc)
end

if Config.ExtrasEnabled then
	for k, v in pairs(Config.ExtraCommands) do
		RegisterCommand(k, v.Func)
		--log("Created /"..k.." ("..v.Desc..")") -- Useful for translation checking.
		TriggerEvent('chat:addSuggestion', '/' .. k, v.Desc)
	end
end

AddEventHandler('onResourceStop', function(resource) -- Mostly for development, restart the resource and it will put all the clothes back on.
	if resource == GetCurrentResourceName() then
		ResetClothing()
	end
end)

function IncurCooldown(ms)
	CreateThread(function()
		Cooldown = true
		Wait(ms)
		Cooldown = false
	end)
end

function IsMpPed(ped)
	local male = `mp_m_freemode_01`
	local female = `mp_f_freemode_01`
	local CurrentModel = GetEntityModel(ped)
	if CurrentModel == male then return 'male' elseif CurrentModel == female then return 'female' else return false end
end

RegisterNetEvent('dpc:EquipLast', function()
	local Ped = PlayerPedId()
	for _, v in pairs(LastEquipped) do
		if v then
			if v.Drawable then
				SetPedComponentVariation(Ped, v.ID, v.Drawable, v.Texture, 0)
			elseif v.Prop then
				ClearPedProp(Ped, v.ID)
				SetPedPropIndex(Ped, v.ID, v.Prop, v.Texture, true)
			end
		end
	end
	LastEquipped = {}
end)

RegisterNetEvent('dpc:ResetClothing', function()
	LastEquipped = {}
end)