var InventoryOption = "0, 0, 0";
var totalWeight = 0;
var totalWeightOther = 0;
var playerMaxWeight = 0;
var otherMaxWeight = 0;
var otherLabel = "";
var ClickedItemData = {};
var SelectedAttachment = null;
var AttachmentScreenActive = false;
var ControlPressed = false;
var disableRightMouse = false;
var selectedItem = null;
var IsDragging = false;

$(document).on("keydown", function(event) {
    if (event.repeat) {
        return;
    }
    switch (event.keyCode) {
        case 27: // ESC
            Inventory.Close();
            break;
        case 9: // TAB
            Inventory.Close();
            break;
        case 17: // CTRL
            ControlPressed = true;
            break;
    }
});

$(document).on("dblclick", ".item-slot", function(e) {
    var ItemData = $(this).data("item");
    var ItemInventory = $(this).parent().attr("data-inventory");
    if (ItemData) {
        Inventory.Close();
        $.post(
            "https://qb-inventory/UseItem",
            JSON.stringify({
                inventory: ItemInventory,
                item: ItemData,
            })
        );
    }
});

$(document).on("keyup", function(event) {
    switch (event.keyCode) {
        case 17: // CTRL
            ControlPressed = false;
            break;
    }
});

$(document).on("mouseenter", ".item-slot", function(e) {
    e.preventDefault();
    var item = $(this).data("item");
    if (item != null) {
        $(".ply-iteminfo-container").fadeIn(150);
        FormatItemInfo(item);
    } else {
        $(".ply-iteminfo-container").fadeOut(100);
    }
});

// Define the FormatItemInfo function
function FormatItemInfo(item) {
    // Format the item data and display it in the info container
    var itemInfo = `
        <p><strong>Name:</strong> ${item.name}</p>
        <p><strong>Weight:</strong> ${item.weight}</p>
        <p><strong>Description:</strong> ${item.description || "No description available"}</p>
    `;
    $(".ply-iteminfo-container").html(itemInfo);
}

function GetFirstFreeSlot($toInv, $fromSlot) {
    var retval = null;
    $.each($toInv.find(".item-slot"), function(i, slot) {
        if ($(slot).data("item") === undefined) {
            if (retval === null) {
                retval = i + 1;
            }
        }
    });
    return retval;
}

function CanQuickMove() {
    var otherinventory = otherLabel.toLowerCase();
    var retval = true;
    if (otherinventory.split("-")[0] == "player") {
        retval = false;
    }
    return retval;
}


//clothesbegin
$(function(){
    $(`#maske`).click(function(){
        $.post(`https://qb-inventory/maske`);
        Inventory.Close();
    })
    $(`#oberteil`).click(function(){
        $.post(`https://qb-inventory/shirts`);
        Inventory.Close();
    })
    $(`#brille`).click(function(){
        $.post(`https://qb-inventory/brille`);
        Inventory.Close();
    })
    $(`#uhr`).click(function(){
        $.post(`https://qb-inventory/uhr`);
        Inventory.Close();
    })
    $(`#ohrringe`).click(function(){
        $.post(`https://qb-inventory/ohrringe`);
        Inventory.Close();
    })
    $(`#handschuhe`).click(function(){
        $.post(`https://qb-inventory/handschuhe`);
        Inventory.Close();
    })
    $(`#kopf`).click(function(){
        $.post(`https://qb-inventory/kopf`);
        Inventory.Close();
    })
    $(`#weste`).click(function(){
        $.post(`https://qb-inventory/weste`);
        Inventory.Close();
    })
    $(`#unterteil`).click(function(){
        $.post(`https://qb-inventory/unterteil`);
        Inventory.Close();
    })
    $(`#schuhe`).click(function(){
        $.post(`https://qb-inventory/schuhe`);
        Inventory.Close();
    })
    $(`#armor`).click(function(){
        $.post(`https://qb-inventory/armor`);
        Inventory.Close();
    })
    $(`#bileklik`).click(function(){
        $.post(`https://qb-inventory/bileklik`);
        Inventory.Close();
    })
    $(`#rucksack`).click(function(){
        $.post(`https://qb-inventory/rucksack`);
        Inventory.Close();
    })
})

$(document).on("mousedown", ".item-slot", function(event) {
    switch (event.which) {
        case 3:
            fromSlot = $(this).attr("data-slot");
            fromInventory = $(this).parent();

            if ($(fromInventory).attr("data-inventory") == "player") {
                toInventory = $(".other-inventory");
            } else {
                toInventory = $(".player-inventory");
            }
            toSlot = GetFirstFreeSlot(toInventory, $(this));
            if ($(this).data("item") === undefined) {
                return;
            }
            toAmount = $(this).data("item").amount;
            if (toAmount > 1) {
                toAmount = 1;
            }
            if (CanQuickMove()) {
                if (toSlot === null) {
                    InventoryError(fromInventory, fromSlot);
                    return;
                }
                if (fromSlot == toSlot && fromInventory == toInventory) {
                    return;
                }
                if (toAmount >= 0) {
                    if (
                        updateweights(
                            fromSlot,
                            toSlot,
                            fromInventory,
                            toInventory,
                            toAmount
                        )
                    ) {
                        swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                    }
                }
            } else {
                InventoryError(fromInventory, fromSlot);
            }
            break;
    }
});

$(document).on("click", ".item-slot", function(e) {
    e.preventDefault();
    var ItemData = $(this).data("item");

    if (ItemData !== null && ItemData !== undefined) {
        if (ItemData.name !== undefined) {
            if (ItemData.name.split("_")[0] == "weapon") {
                if (!$("#weapon-attachments").length) {
                    $(".inv-options-list").append(
                        '<div class="inv-option-itemw" id="weapon-attachments"><p>Attachments</p></div>'
                    );
                    $("#weapon-attachments").hide().fadeIn(250);
                    ClickedItemData = ItemData;
                } else if (ClickedItemData == ItemData) {
                    $("#weapon-attachments").fadeOut(250, function() {
                        $("#weapon-attachments").remove();
                    });
                    ClickedItemData = {};
                } else {
                    ClickedItemData = ItemData;
                }
            } else {
                ClickedItemData = {};
                if ($("#weapon-attachments").length) {
                    $("#weapon-attachments").fadeOut(250, function() {
                        $("#weapon-attachments").remove();
                    });
                }
            }
        } else {
            ClickedItemData = {};
            if ($("#weapon-attachments").length) {
                $("#weapon-attachments").fadeOut(250, function() {
                    $("#weapon-attachments").remove();
                });
            }
        }
    } else {
        ClickedItemData = {};
        if ($("#weapon-attachments").length) {
            $("#weapon-attachments").fadeOut(250, function() {
                $("#weapon-attachments").remove();
            });
        }
    }
});

$(document).on("click", "#inv-close", function(e) {
    e.preventDefault();
    Inventory.Close();
});

$(document).on("click", ".weapon-attachments-back", function(e) {
    e.preventDefault();
    $("#qbcore-inventory").css({ display: "block" });
    $("#qbcore-inventory").animate({
            left: 0 + "vw",
        },
        200
    );
    $(".weapon-attachments-container").animate({
            left: -100 + "vw",
        },
        200,
        function() {
            $(".weapon-attachments-container").css({ display: "none" });
        }
    );
    AttachmentScreenActive = false;
});

function FormatAttachmentInfo(data) {
    $.post(
        "https://qb-inventory/GetWeaponData",
        JSON.stringify({
            weapon: data.name,
            ItemData: ClickedItemData,
        }),
        function(data) {
            var AmmoLabel = "9mm";
            var Durability = 100;
            if (data.WeaponData.ammotype == "AMMO_RIFLE") {
                AmmoLabel = "7.62";
            } else if (data.WeaponData.ammotype == "AMMO_SHOTGUN") {
                AmmoLabel = "12 Gauge";
            }
            if (ClickedItemData.info.quality !== undefined) {
                Durability = ClickedItemData.info.quality;
            }

            $(".weapon-attachments-container-title").html(
                data.WeaponData.label + " | " + AmmoLabel
            );
            $(".weapon-attachments-container-description").html(
                data.WeaponData.description
            );
            $(".weapon-attachments-container-details").html(
                '<span style="font-weight: bold; letter-spacing: .1vh;">Seri Numarası</span><br> ' +
                ClickedItemData.info.serie +
                '<br><br><span style="font-weight: bold; letter-spacing: .1vh;">Durability - ' +
                Durability.toFixed() +
                '% </span> <div class="weapon-attachments-container-detail-durability"><div class="weapon-attachments-container-detail-durability-total"></div></div>'
            );
            $(".weapon-attachments-container-detail-durability-total").css({
                width: Durability + "%",
            });
            $(".weapon-attachments-container-image").attr(
                "src",
                "./attachment_images/" + data.WeaponData.name + ".png"
            );
            $(".weapon-attachments").html("");

            if (data.AttachmentData !== null && data.AttachmentData !== undefined) {
                if (data.AttachmentData.length > 0) {
                    $(".weapon-attachments-title").html(
                        '<span style="font-weight: bold; letter-spacing: .1vh;">Attachments</span>'
                    );
                    $.each(data.AttachmentData, function(i, attachment) {
                        var WeaponType = data.WeaponData.ammotype
                            .split("_")[1]
                            .toLowerCase();
                        $(".weapon-attachments").append(
                            '<div class="weapon-attachment" id="weapon-attachment-' +
                            i +
                            '"> <div class="weapon-attachment-label"><p>' +
                            attachment.label +
                            '</p></div> <div class="weapon-attachment-img"><img src="./images/' +
                            WeaponType +
                            "_" +
                            attachment.attachment +
                            '.png"></div> </div>'
                        );
                        attachment.id = i;
                        $("#weapon-attachment-" + i).data("AttachmentData", attachment);
                    });
                } else {
                    $(".weapon-attachments-title").html(
                        '<span style="font-weight: bold; letter-spacing: .1vh;">This weapon does not contain attachments.</span>'
                    );
                }
            } else {
                $(".weapon-attachments-title").html(
                    '<span style="font-weight: bold; letter-spacing: .1vh;">This weapon does not contain attachments.</span>'
                );
            }

            handleAttachmentDrag();
        }
    );
}

var AttachmentDraggingData = {};

function handleAttachmentDrag() {
    $(".weapon-attachment").draggable({
        helper: "clone",
        appendTo: "body",
        scroll: true,
        revertDuration: 0,
        revert: "invalid",
        start: function(event, ui) {
            var ItemData = $(this).data("AttachmentData");
            $(this).addClass("weapon-dragging-class");
            AttachmentDraggingData = ItemData;
        },
        stop: function() {
            $(this).removeClass("weapon-dragging-class");
        },
    });
    $(".weapon-attachments-remove").droppable({
        accept: ".weapon-attachment",
        hoverClass: "weapon-attachments-remove-hover",
        drop: function(event, ui) {
            $.post(
                "https://qb-inventory/RemoveAttachment",
                JSON.stringify({
                    AttachmentData: AttachmentDraggingData,
                    WeaponData: ClickedItemData,
                }),
                function(data) {
                    if (data.Attachments !== null && data.Attachments !== undefined) {
                        if (data.Attachments.length > 0) {
                            $("#weapon-attachment-" + AttachmentDraggingData.id).fadeOut(
                                150,
                                function() {
                                    $("#weapon-attachment-" + AttachmentDraggingData.id).remove();
                                    AttachmentDraggingData = null;
                                }
                            );
                        } else {
                            $("#weapon-attachment-" + AttachmentDraggingData.id).fadeOut(
                                150,
                                function() {
                                    $("#weapon-attachment-" + AttachmentDraggingData.id).remove();
                                    AttachmentDraggingData = null;
                                    $(".weapon-attachments").html("");
                                }
                            );
                            $(".weapon-attachments-title").html(
                                '<span style="font-weight: bold; letter-spacing: .1vh;">Bu silah eklenti içermiyor</span>'
                            );
                        }
                    } else {
                        $("#weapon-attachment-" + AttachmentDraggingData.id).fadeOut(
                            150,
                            function() {
                                $("#weapon-attachment-" + AttachmentDraggingData.id).remove();
                                AttachmentDraggingData = null;
                                $(".weapon-attachments").html("");
                            }
                        );
                        $(".weapon-attachments-title").html(
                            '<span style="font-weight: bold; letter-spacing: .1vh;">Bu silah eklenti içermiyor</span>'
                        );
                    }
                }
            );
        },
    });
}

$(document).on("click", "#weapon-attachments", function(e) {
    e.preventDefault();
    if (!Inventory.IsWeaponBlocked(ClickedItemData.name)) {
        $(".weapon-attachments-container").css({ display: "block" });
        $("#qbcore-inventory").animate({
                left: 100 + "vw",
            },
            200,
            function() {
                $("#qbcore-inventory").css({ display: "none" });
            }
        );
        $(".weapon-attachments-container").animate({
                left: 0 + "vw",
            },
            200
        );
        AttachmentScreenActive = true;
        FormatAttachmentInfo(ClickedItemData);
    } else {
        $.post(
            "https://qb-inventory/Notify",
            JSON.stringify({
                message: "Bu silah için eklenti mevcut değil.",
                type: "error",
            })
        );
    }
});

function generateDescription(itemData) {
    if (itemData.type === "weapon") {
        let ammo = itemData.info.ammo ?? 0;
        return `<p><strong>Name : </strong><span>${itemData.info.serie}</span></p>
                    <p><strong>Ammunition: </strong><span>${ammo}</span></p>
                    <p>${itemData.description}</p>`;
    }

    if (itemData.name == "phone" && itemData.info.lbPhoneNumber) {
        return `<p><strong>Phone Number: </strong><span>${itemData.info.lbFormattedNumber ?? itemData.info.lbPhoneNumber}</span></p>`;
    }

    switch (itemData.name) {
        case "id_card":
            return `<p><strong>CSN: </strong><span>${itemData.info.citizenid}</span></p>
              <p><strong>First Name: </strong><span>${itemData.info.firstname}</span></p>
              <p><strong>Last Name: </strong><span>${itemData.info.lastname}</span></p>
              <p><strong>Birth Date: </strong><span>${itemData.info.birthdate}</span></p>
              <p><strong>Gender: </strong><span>${getGender(itemData.info)}</span></p>
              <p><strong>Nationality: </strong><span>${itemData.info.nationality}</span></p>`;
        case "driver_license":
            return `<p><strong>First Name: </strong><span>${itemData.info.firstname}</span></p>
            <p><strong>Last Name: </strong><span>${itemData.info.lastname}</span></p>
            <p><strong>Birth Date: </strong><span>${itemData.info.birthdate}</span>
            </p><p><strong>Licenses: </strong><span>${itemData.info.type}</span></p>`;
        case "weaponlicense":
            return `<p><strong>First Name: </strong><span>${itemData.info.firstname}</span></p>`;
        case "lawyerpass":
            return `<p><strong>Pass-ID: </strong><span>${itemData.info.id}</span></p>
            <p><strong>First Name: </strong><span>${itemData.info.firstname}</span></p>
            <p><strong>Last Name: </strong><span>${itemData.info.lastname}</span></p>
            <p><strong>CSN: </strong><span>${itemData.info.citizenid}</span></p>`;
        case "syphoningkit":
            return `<p><strong>A kit used to syphon gasoline from vehicles! </strong><span>${itemData.info.gasamount} Liters Inside.</span></p>`
        case "jerrycan":
            return `<p><strong>A Jerry Can, designed to hold fuel! </strong><span>${itemData.info.gasamount} Liters Inside.</span></p>`
        case "wateringcan":
            return `<p><strong>A Watering Can, designed to hold Water ! </strong><span>${itemData.info.durability} Liters Inside.</span></p>`
        case "spraycan":
            return `<p><strong>Spray: </strong><span>${itemData.info.name}</span></p>`;   
        case "harness":
                 if (itemData.name == "mechboard") {
                $(".item-info-title").html("<p>" + itemData.label + "</p>");
                $(".item-info-description").html(
                    "<p>" + itemData.info.vehplate + "</p>" +
                    "<p>" + itemData.info.veh + "</p>"
                )
                }
                else if (itemData.name == "mechboard") {
                    $(".item-info-title").html("<p>" + itemData.label + "</p>");
                    $(".item-info-description").html(
                        "<p>" + itemData.info.vehplate + "</p>" +
                        "<p>" + itemData.info.veh + "</p>"
                )}  
        case "ciggypack":
            return `<p><strong>Cigarettes : </strong><span>${itemData.info.uses} Liters Inside.</span></p>`
        case "lockpick":
            return `<p><strong>Remaining uses : </strong><span>${itemData.info.uses}</span></p>
            <p><strong>Type: </strong><span>${itemData.info.tier}</span></p>`
        case "breaker":
        return `<p><strong>Remaining uses : </strong><span>${itemData.info.uses}</span></p>
        <p><strong>Type: </strong><span>${itemData.info.tier}</span></p>`
        case "drill":
            return `<p><strong>Remaining uses : </strong><span>${itemData.info.uses || 2}</span></p>`
        case "hack_device":
            return `<p><strong>Remaining uses : </strong><span>${itemData.info.uses || 2}</span></p>`
        case "filled_evidence_bag":
            if (itemData.info.type == "casing") {
                return `<p><strong>Evidence material: </strong><span>${itemData.info.label}</span></p>
                <p><strong>Type number: </strong><span>${itemData.info.ammotype}</span></p>
                <p><strong>Caliber: </strong><span>${itemData.info.ammolabel}</span></p>
                <p><strong>Name: </strong><span>${itemData.info.serie}</span></p>
                <p><strong>Crime scene: </strong><span>${itemData.info.street}</span></p><br /><p>${itemData.description}</p>`;
            } else if (itemData.info.type == "blood") {
                return `<p><strong>Evidence material: </strong><span>${itemData.info.label}</span></p>
                <p><strong>Blood type: </strong><span>${itemData.info.bloodtype}</span></p>
                <p><strong>DNA Code: </strong><span>${itemData.info.dnalabel}</span></p>
                <p><strong>Crime scene: </strong><span>${itemData.info.street}</span></p><br /><p>${itemData.description}</p>`;
            }
            
            else if (itemData.name == "key1") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html("<p>Room Number: #" + itemData.info.roomnumber + "</p>");
             }
            else if (itemData.name == "nitrous") {
                $(".item-info-title").html("<p>" + itemData.label + "</p>");
                $(".item-info-description").html(
                    "<p>" + itemData.info.status + " nitrous bottle</p>");
            }

            else if (itemData.name == "mask") {
                $(".item-info-title").html("<p>" + itemData.label + "</p>");
                $(".item-info-description").html("<p>Number: " + itemData.info.number + "</p> <p>Texture: " + itemData.info.texture + "</p>");
            }

            else if (itemData.name == "torso") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(
                "<p><strong>Id Clothe: </strong><span>" +
                itemData.info.id_clothe +
                "</span></p><p><strong>Id Texture: </strong><span>" +
                itemData.info.id_texture +
                "</span></p><p><strong>Description: </strong><span>" +
                itemData.info.description +
                "</span></p>"
            );
        } else if (itemData.name == "tshirt") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(
                "<p><strong>Id Clothe: </strong><span>" +
                itemData.info.id_clothe +
                "</span></p><p><strong>Id Texture: </strong><span>" +
                itemData.info.id_texture +
                "</span></p><p><strong>Description: </strong><span>" +
                itemData.info.description +
                "</span></p>"
            );
        } else if (itemData.name == "arms") {
        $(".item-info-title").html("<p>" + itemData.label + "</p>");
        $(".item-info-description").html(
            "<p><strong>Id Clothe: </strong><span>" +
            itemData.info.id_clothe +
            "</span></p><p><strong>Id Texture: </strong><span>" +
            itemData.info.id_texture +
            "</span></p><p><strong>Description: </strong><span>" +
            itemData.info.description +
            "</span></p>"
        ); } else if (itemData.name == "jeans") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(
                "<p><strong>Id Clothe: </strong><span>" +
                itemData.info.id_clothe +
                "</span></p><p><strong>Id Texture: </strong><span>" +
                itemData.info.id_texture +
                "</span></p><p><strong>Description: </strong><span>" +
                itemData.info.description +
                "</span></p>"
            );
        } else if (itemData.name == "shoes") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(
                "<p><strong>Id Clothe: </strong><span>" +
                itemData.info.id_clothe +
                "</span></p><p><strong>Id Texture: </strong><span>" +
                itemData.info.id_texture +
                "</span></p><p><strong>Description: </strong><span>" +
                itemData.info.description +
                "</span></p>"
            );
        } else if (itemData.name == "bag") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(
                "<p><strong>Id Clothe: </strong><span>" +
                itemData.info.id_clothe +
                "</span></p><p><strong>Id Texture: </strong><span>" +
                itemData.info.id_texture +
                "</span></p><p><strong>Description: </strong><span>" +
                itemData.info.description +
                "</span></p>"
            ); 
        } else if (itemData.name == "chain") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(
                "<p><strong>Id Clothe: </strong><span>" +
                itemData.info.id_clothe +
                "</span></p><p><strong>Id Texture: </strong><span>" +
                itemData.info.id_texture +
                "</span></p><p><strong>Description: </strong><span>" +
                itemData.info.description +
                "</span></p>"
            );
        } else if (itemData.name == "mask") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html(
                "<p><strong>Id Clothe: </strong><span>" +
                itemData.info.id_clothe +
                "</span></p><p><strong>Id Texture: </strong><span>" +
                itemData.info.id_texture +
                "</span></p><p><strong>Description: </strong><span>" +
                itemData.info.description +
                "</span></p>"
            );
        }
            else if (itemData.info.type == "fingerprint") {
                return `<p><strong>Evidence material: </strong><span>${itemData.info.label}</span></p>
                <p><strong>Fingerprint: </strong><span>${itemData.info.fingerprint}</span></p>
                <p><strong>Crime Scene: </strong><span>${itemData.info.street}</span></p><br /><p>${itemData.description}</p>`;
            }
                
             else if (itemData.info.type == "dna") {
                return `<p><strong>Evidence material: </strong><span>${itemData.info.label}</span></p>
                <p><strong>DNA Code: </strong><span>${itemData.info.dnalabel}</span></p><br /><p>${itemData.description}</p>`;
            }
        case "rc_monster":
            return `<p><strong>Serie Number: </strong><span>${itemData.info.serie}</span></p>`;
        case "rc_ruiner":
            return `<p><strong>Serie Number: </strong><span>${itemData.info.serie}</span></p>`;
        case "rc_sultanrs":
            return `<p><strong>Serie Number: </strong><span>${itemData.info.serie}</span></p>`;
        case "rc_bandito":
            return `<p><strong>Serie Number: </strong><span>${itemData.info.serie}</span></p>`;
        case "rc_bandito_offroad":
            return `<p><strong>Serie Number: </strong><span>${itemData.info.serie}</span></p>`;
        case "rc_bandito_trophy":
            return `<p><strong>Serie Number: </strong><span>${itemData.info.serie}</span></p>`;
        case "rc_bandito_gang":
            return `<p><strong>Serie Number: </strong><span>${itemData.info.serie}</span></p>`;
        case "rc_bandito_big":
            return `<p><strong>Serie Number: </strong><span>${itemData.info.serie}</span></p>`;
        case "rc_bandito_midnight":
            return `<p><strong>Serie Number: </strong><span>${itemData.info.serie}</span></p>`;    
        case "stickynote":
            return `<p>${itemData.info.label}</p>`;
        case "moneybag":
            return `<p><strong>Amount of cash: </strong><span>$${itemData.info.cash}</span></p>`;
        case "markedbills":
            return `<p><strong>Worth: </strong><span>$${itemData.info.worth}</span></p>`;
        case "visa":
            return `<p><strong>Card Holder: </strong><span>${itemData.info.name}</span></p>`;
        case "mastercard":
            return `<p><strong>Card Holder: </strong><span>${itemData.info.name}</span></p>`;
        case "spraycan":
            return `<p><strong>Spray: </strong><span>${itemData.info.name}</span></p>`;
        case "labkey":
            return `<p>Lab: ${itemData.info.lab}</p>`;
        default:
            return itemData.description;
    }
}

function handleDragDrop() {
    $(".item-drag").draggable({
        helper: "clone",
        appendTo: "body",
        scroll: true,
        revertDuration: 0,
        revert: "invalid",
        cancel: ".item-nodrag",
        start: function(event, ui) {
            IsDragging = true;
            $(this).find("img").css("filter", "brightness(50%)");
            var itemData = $(this).data("item");
            var dragAmount = $("#item-amount").val();
            if (!itemData.useable) {
                $("#item-use").css("background", "rgba(35,35,35, 0.5");
            }

            if (dragAmount == 0) {
                if (itemData.price != null) {
                    $(this).find(".item-slot-amount p").html("0 (0.0)");
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html("(" + itemData.amount + ") $" + itemData.price);
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                    }
                } else {
                    $(this).find(".item-slot-amount p").html("0 (0.0)");
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html(
                            itemData.amount
                        );
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                    }
                }
            } else if (dragAmount > itemData.amount) {
                if (itemData.price != null) {
                    $(this)
                        .find(".item-slot-amount p")
                        .html("(" + itemData.amount + ") $" + itemData.price);
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                    }
                } else {
                    $(this)
                        .find(".item-slot-amount p")
                        .html(
                            itemData.amount
                        );
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                    }
                }
                InventoryError($(this).parent(), $(this).attr("data-slot"));
            } else if (dragAmount > 0) {
                if (itemData.price != null) {
                    $(this)
                        .find(".item-slot-amount p")
                        .html("(" + itemData.amount + ") $" + itemData.price);
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html("(" + itemData.amount + ") $" + itemData.price);
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                    }
                } else {
                    $(this)
                        .find(".item-slot-amount p")
                        .html(itemData.amount);
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html(dragAmount);
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                    }
                }
            } else {
                if ($(this).parent().attr("data-inventory") == "hotbar") {
                }
                $(".ui-draggable-dragging").find(".item-slot-key").remove();
                $(this)
                    .find(".item-slot-amount p")
                    .html(itemData.amount);
                InventoryError($(this).parent(), $(this).attr("data-slot"));
            }
        },
        stop: function() {
            setTimeout(function() {
                IsDragging = false;
            }, 300);
            $(this).css("background", "rgba(222, 226, 230, 0.06)");
            $(this).find("img").css("filter", "brightness(100%)");
            $("#item-use").css("background", "rgba(" + InventoryOption + ", 0.3)");
        },
    });

    $(".item-slot").droppable({
        hoverClass: "item-slot-hoverClass",
        drop: function(event, ui) {
            setTimeout(function() {
                IsDragging = false;
            }, 300);
            fromSlot = ui.draggable.attr("data-slot");
            fromInventory = ui.draggable.parent();
            toSlot = $(this).attr("data-slot");
            toInventory = $(this).parent();
            toAmount = $("#item-amount").val();

            if (fromSlot == toSlot && fromInventory == toInventory) {
                return;
            }
            if (toAmount >= 0) {
                if (
                    updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)
                ) {
                    swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                }
            }
        },
    });

    $("#item-use").droppable({
        hoverClass: "button-hover",
        drop: function(event, ui) {
            setTimeout(function() {
                IsDragging = false;
            }, 300);
            fromData = ui.draggable.data("item");
            fromInventory = ui.draggable.parent().attr("data-inventory");
            if (fromData.useable) {
                if (fromData.shouldClose) {
                    Inventory.Close();
                }
                $.post(
                    "https://qb-inventory/UseItem",
                    JSON.stringify({
                        inventory: fromInventory,
                        item: fromData,
                    })
                );
            }
        },
    });
    $('#item-place').droppable({
        hoverClass: 'button-hover',
        drop: function (event, ui) {
          setTimeout(function () {
            IsDragging = false
          }, 300)
          fromData = ui.draggable.data('item')
          if (fromData.useable) {
            Inventory.Close()
            $.post(
              'https://qb-inventory/PlaceItem',
              JSON.stringify({
                item: fromData
              })
            )
          }
        }
      })
    $("#item-drop").droppable({
        hoverClass: "item-slot-hoverClass",
        drop: function(event, ui) {
            setTimeout(function() {
                IsDragging = false;
            }, 300);
            fromData = ui.draggable.data("item");
            fromInventory = ui.draggable.parent().attr("data-inventory");
            amount = $("#item-amount").val();
            if (amount == 0) {
                amount = fromData.amount;
            }
            $(this).css("background", "rgba(35,35,35, 0.7");
            $.post(
                "https://qb-inventory/DropItem",
                JSON.stringify({
                    inventory: fromInventory,
                    item: fromData,
                    amount: parseInt(amount),
                })
            );
        },
    });
}

function updateweights($fromSlot, $toSlot, $fromInv, $toInv, $toAmount) {
    var otherinventory = otherLabel.toLowerCase();
    if (otherinventory.split("-")[0] == "dropped") {
        toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if (toData !== null && toData !== undefined) {
            InventoryError($fromInv, $fromSlot);
            return false;
        }
    }

    if (
        ($fromInv.attr("data-inventory") == "hotbar" &&
            $toInv.attr("data-inventory") == "player") ||
        ($fromInv.attr("data-inventory") == "player" &&
            $toInv.attr("data-inventory") == "hotbar") ||
        ($fromInv.attr("data-inventory") == "player" &&
            $toInv.attr("data-inventory") == "player") ||
        ($fromInv.attr("data-inventory") == "hotbar" &&
            $toInv.attr("data-inventory") == "hotbar")
    ) {
        return true;
    }

    if (
        ($fromInv.attr("data-inventory").split("-")[0] == "itemshop" &&
            $toInv.attr("data-inventory").split("-")[0] == "itemshop") ||
        ($fromInv.attr("data-inventory") == "crafting" &&
            $toInv.attr("data-inventory") == "crafting")
    ) {
        itemData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>(' +
                    itemData.amount +
                    ") $" +
                    itemData.price +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        } else {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    ' </p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if (
        $toAmount == 0 &&
        ($fromInv.attr("data-inventory").split("-")[0] == "itemshop" ||
            $fromInv.attr("data-inventory") == "crafting")
    ) {
        itemData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>(' +
                    itemData.amount +
                    ") $" +
                    itemData.price +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        } else {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '/></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if (
        $toInv.attr("data-inventory").split("-")[0] == "itemshop" ||
        $toInv.attr("data-inventory") == "crafting"
    ) {
        itemData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if ($toInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $toInv
                .find("[data-slot=" + $toSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>(' +
                    itemData.amount +
                    ") $" +
                    itemData.price +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        } else {
            $toInv
                .find("[data-slot=" + $toSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if ($fromInv.attr("data-inventory") != $toInv.attr("data-inventory")) {
        fromData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if ($toAmount == 0) {
            $toAmount = fromData.amount;
        }
        if (toData == null || fromData.name == toData.name) {
            if (
                $fromInv.attr("data-inventory") == "player" ||
                $fromInv.attr("data-inventory") == "hotbar"
            ) {
                totalWeight = totalWeight - fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther + fromData.weight * $toAmount;
            } else {
                totalWeight = totalWeight + fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther - fromData.weight * $toAmount;
            }
        } else {
            if (
                $fromInv.attr("data-inventory") == "player" ||
                $fromInv.attr("data-inventory") == "hotbar"
            ) {
                totalWeight = totalWeight - fromData.weight * $toAmount;
                totalWeight = totalWeight + toData.weight * toData.amount;

                totalWeightOther = totalWeightOther + fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther - toData.weight * toData.amount;
            } else {
                totalWeight = totalWeight + fromData.weight * $toAmount;
                totalWeight = totalWeight - toData.weight * toData.amount;

                totalWeightOther = totalWeightOther - fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther + toData.weight * toData.amount;
            }
        }
    }

    if (
        totalWeight > playerMaxWeight ||
        (totalWeightOther > otherMaxWeight &&
            $fromInv.attr("data-inventory").split("-")[0] != "itemshop" &&
            $fromInv.attr("data-inventory") != "crafting")
    ) {
        InventoryError($fromInv, $fromSlot);
        return false;
    }

    $("#player-inv-weight").html(
        "<b> " +
        (parseInt(totalWeight) / 1000).toFixed(2) +
        "</b>/<span>" +
        (playerMaxWeight / 1000) + " kg</span>"
    );
    if (
        $fromInv.attr("data-inventory").split("-")[0] != "itemshop" &&
        $toInv.attr("data-inventory").split("-")[0] != "itemshop" &&
        $fromInv.attr("data-inventory") != "crafting" &&
        $toInv.attr("data-inventory") != "crafting"
    ) {
        $("#other-inv-label").html(otherLabel);
        $("#other-inv-weight").html(
            "" +
            (parseInt(totalWeightOther) / 1000).toFixed(2) +
            " / " +
            (otherMaxWeight / 1000)
        );
    }

    return true;
}

var combineslotData = null;

$(document).on("click", ".CombineItem", function(e) {
    e.preventDefault();
    if (combineslotData.toData.combinable.anim != null) {
        $.post(
            "https://qb-inventory/combineWithAnim",
            JSON.stringify({
                combineData: combineslotData.toData.combinable,
                usedItem: combineslotData.toData.name,
                requiredItem: combineslotData.fromData.name,
            })
        );
    } else {
        $.post(
            "https://qb-inventory/combineItem",
            JSON.stringify({
                reward: combineslotData.toData.combinable.reward,
                toItem: combineslotData.toData.name,
                fromItem: combineslotData.fromData.name,
            })
        );
    }
    Inventory.Close();
});

$(document).on("click", ".SwitchItem", function(e) {
    e.preventDefault();
    $(".combine-option-container").hide();

    optionSwitch(
        combineslotData.fromSlot,
        combineslotData.toSlot,
        combineslotData.fromInv,
        combineslotData.toInv,
        combineslotData.toAmount,
        combineslotData.toData,
        combineslotData.fromData
    );
});

function optionSwitch(
    $fromSlot,
    $toSlot,
    $fromInv,
    $toInv,
    $toAmount,
    toData,
    fromData
) {
    fromData.slot = parseInt($toSlot);

    $toInv.find("[data-slot=" + $toSlot + "]").data("item", fromData);

    $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
    $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-weapon");
    $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

    if ($toSlot < 6) {
        $toInv
            .find("[data-slot=" + $toSlot + "]")
            .html(
                '<div class="item-slot-key"><p>' +
                $toSlot +
                '</p></div><div class="item-slot-img"><img src="images/' +
                fromData.image +
                '" alt="' +
                fromData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                fromData.amount +
                '</p></div><div class="item-slot-label"><p>' +
                fromData.label +
                "</p></div>"
            );
    } else {
        $toInv
            .find("[data-slot=" + $toSlot + "]")
            .html(
                '<div class="item-slot-img"><img src="images/' +
                fromData.image +
                '" alt="' +
                fromData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                fromData.amount +
                '</p></div><div class="item-slot-label"><p>' +
                fromData.label +
                "</p></div>"
            );
    }

    toData.slot = parseInt($fromSlot);

    $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
    $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-nodrag");

    $fromInv.find("[data-slot=" + $fromSlot + "]").data("item", toData);

    if ($fromSlot < 6) {
        $fromInv
            .find("[data-slot=" + $fromSlot + "]")
            .html(
                '<div class="item-slot-key"><p>' +
                $fromSlot +
                '</p></div><div class="item-slot-img"><img src="images/' +
                toData.image +
                '" alt="' +
                toData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                toData.amount +
                '</p></div><div class="item-slot-label"><p>' +
                toData.label +
                "</p></div>"
            );
    } else {
        $fromInv
            .find("[data-slot=" + $fromSlot + "]")
            .html(
                '<div class="item-slot-img"><img src="images/' +
                toData.image +
                '" alt="' +
                toData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                toData.amount +
                '")</p></div><div class="item-slot-label"><p>' +
                toData.label +
                "</p></div>"
            );
    }

    $.post(
        "https://qb-inventory/SetInventoryData",
        JSON.stringify({
            fromInventory: $fromInv.attr("data-inventory"),
            toInventory: $toInv.attr("data-inventory"),
            fromSlot: $fromSlot,
            toSlot: $toSlot,
            fromAmount: $toAmount,
            toAmount: toData.amount,
        })
    );
}

function swap($fromSlot, $toSlot, $fromInv, $toInv, $toAmount) {
    fromData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
    toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
    var otherinventory = otherLabel.toLowerCase();

    if (otherinventory.split("-")[0] == "dropped") {
        if (toData !== null && toData !== undefined) {
            InventoryError($fromInv, $fromSlot);
            return;
        }
    }

    if (fromData !== undefined && fromData.amount >= $toAmount) {
        if (fromData.unique && $toAmount > 1) {
            InventoryError($fromInv, $fromSlot);
            return;
        }

        if (
            ($fromInv.attr("data-inventory") == "player" ||
                $fromInv.attr("data-inventory") == "hotbar") &&
            $toInv.attr("data-inventory").split("-")[0] == "itemshop" &&
            $toInv.attr("data-inventory") == "crafting"
        ) {
            InventoryError($fromInv, $fromSlot);
            return;
        }

        if (
            $toAmount == 0 &&
            $fromInv.attr("data-inventory").split("-")[0] == "itemshop" &&
            $fromInv.attr("data-inventory") == "crafting"
        ) {
            InventoryError($fromInv, $fromSlot);
            return;
        } else if ($toAmount == 0) {
            $toAmount = fromData.amount;
        }
        if (
            (toData != undefined || toData != null) &&
            toData.name == fromData.name &&
            !fromData.unique
        ) {
            var newData = [];
            newData.name = toData.name;
            newData.label = toData.label;
            newData.amount = parseInt($toAmount) + parseInt(toData.amount);
            newData.type = toData.type;
            newData.description = toData.description;
            newData.image = toData.image;
            newData.weight = toData.weight;
            newData.info = toData.info;
            newData.useable = toData.useable;
            newData.unique = toData.unique;
            newData.slot = parseInt($toSlot);

            if (fromData.amount == $toAmount) {
                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + newData.label + "</p></div>";
                if (newData.name.split("_")[0] == "weapon") {
                    if (!Inventory.IsWeaponBlocked(newData.name)) {
                        ItemLabel =
                            '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                            newData.label +
                            "</p></div>";
                    }
                }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</p></div>"' +
                            ItemLabel
                        );
                } else if ($toSlot == 41 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            ' </p></div>"' +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            ' </p></div>"' +
                            ItemLabel
                        );
                }

                if (newData.name.split("_")[0] == "weapon") {
                    if (!Inventory.IsWeaponBlocked(newData.name)) {
                        if (newData.info.quality == undefined) {
                            newData.info.quality = 100.0;
                        }
                        var QualityColor = "rgb(39, 174, 96)";
                        if (newData.info.quality < 25) {
                            QualityColor = "rgb(192, 57, 43)";
                        } else if (newData.info.quality > 25 && newData.info.quality < 50) {
                            QualityColor = "rgb(230, 126, 34)";
                        } else if (newData.info.quality >= 50) {
                            QualityColor = "rgb(39, 174, 96)";
                        }
                        if (newData.info.quality !== undefined) {
                            qualityLabel = newData.info.quality.toFixed();
                        } else {
                            qualityLabel = newData.info.quality;
                        }
                        if (newData.info.quality == 0) {
                            qualityLabel = "Bozuldu";
                        }
                        $toInv
                            .find("[data-slot=" + $toSlot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: qualityLabel + "%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    }
                }

                $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-drag");
                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-nodrag");

                $fromInv.find("[data-slot=" + $fromSlot + "]").removeData("item");
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .html(
                        '<div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                    );
            } else if (fromData.amount > $toAmount) {
                var newDataFrom = [];
                newDataFrom.name = fromData.name;
                newDataFrom.label = fromData.label;
                newDataFrom.amount = parseInt(fromData.amount - $toAmount);
                newDataFrom.type = fromData.type;
                newDataFrom.description = fromData.description;
                newDataFrom.image = fromData.image;
                newDataFrom.weight = fromData.weight;
                newDataFrom.price = fromData.price;
                newDataFrom.info = fromData.info;
                newDataFrom.useable = fromData.useable;
                newDataFrom.unique = fromData.unique;
                newDataFrom.slot = parseInt($fromSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + newData.label + "</p></div>";
                if (newData.name.split("_")[0] == "weapon") {
                    if (!Inventory.IsWeaponBlocked(newData.name)) {
                        ItemLabel =
                            '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                            newData.label +
                            "</p></div>";
                    }
                }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            ' </p></div>"' +
                            ItemLabel
                        );
                } else if ($toSlot == 41 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            ' </p></div>"' +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            ' </p></div>"' +
                            ItemLabel
                        );
                }

                if (newData.name.split("_")[0] == "weapon") {
                    if (!Inventory.IsWeaponBlocked(newData.name)) {
                        if (newData.info.quality == undefined) {
                            newData.info.quality = 100.0;
                        }
                        var QualityColor = "rgb(39, 174, 96)";
                        if (newData.info.quality < 25) {
                            QualityColor = "rgb(192, 57, 43)";
                        } else if (newData.info.quality > 25 && newData.info.quality < 50) {
                            QualityColor = "rgb(230, 126, 34)";
                        } else if (newData.info.quality >= 50) {
                            QualityColor = "rgb(39, 174, 96)";
                        }
                        if (newData.info.quality !== undefined) {
                            qualityLabel = newData.info.quality.toFixed();
                        } else {
                            qualityLabel = newData.info.quality;
                        }
                        if (newData.info.quality == 0) {
                            qualityLabel = "Bozuldu";
                        }
                        $toInv
                            .find("[data-slot=" + $toSlot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: qualityLabel + "%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    }
                }
				
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .data("item", newDataFrom);

                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-weapon");
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .removeClass("item-nodrag");

                if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newDataFrom.image +
                            '" alt="' +
                            newDataFrom.name +
                            '" /></div><div class="item-slot-amount"><p>(' +
                            newDataFrom.amount +
                            ") $" +
                            newDataFrom.price +
                            '</p></div><div class="item-slot-label"><p>' +
                            newDataFrom.label +
                            "</p></div>"
                        );
                } else {
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' +
                        newDataFrom.label +
                        "</p></div>";
                    if (newDataFrom.name.split("_")[0] == "weapon") {
                        if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                            ItemLabel =
                                '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                                newDataFrom.label +
                                "</p></div>";
                        }
                    }

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                ' </p></div>"' +
                                ItemLabel
                            );
                    } else if (
                        $fromSlot == 41 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                ' </p></div>"' +
                                ItemLabel
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                ' </p></div>"' +
                                ItemLabel
                            );
                    }

                    if (newDataFrom.name.split("_")[0] == "weapon") {
                        if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                            if (newDataFrom.info.quality == undefined) {
                                newDataFrom.info.quality = 100.0;
                            }
                            var QualityColor = "rgb(39, 174, 96)";
                            if (newDataFrom.info.quality < 25) {
                                QualityColor = "rgb(192, 57, 43)";
                            } else if (
                                newDataFrom.info.quality > 25 &&
                                newDataFrom.info.quality < 50
                            ) {
                                QualityColor = "rgb(230, 126, 34)";
                            } else if (newDataFrom.info.quality >= 50) {
                                QualityColor = "rgb(39, 174, 96)";
                            }
                            if (newDataFrom.info.quality !== undefined) {
                                qualityLabel = newDataFrom.info.quality.toFixed();
                            } else {
                                qualityLabel = newDataFrom.info.quality;
                            }
                            if (newDataFrom.info.quality == 0) {
                                qualityLabel = "Bozuldu";
                            }
                            $fromInv
                                .find("[data-slot=" + $fromSlot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: qualityLabel + "%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        }
                    }
                }
            }
            $.post("https://qb-inventory/PlayDropSound", JSON.stringify({}));
            $.post(
                "https://qb-inventory/SetInventoryData",
                JSON.stringify({
                    fromInventory: $fromInv.attr("data-inventory"),
                    toInventory: $toInv.attr("data-inventory"),
                    fromSlot: $fromSlot,
                    toSlot: $toSlot,
                    fromAmount: $toAmount,
                })
            );
        } else {
            if (fromData.amount == $toAmount) {
                if (
                    toData != undefined &&
                    toData.combinable != null &&
                    isItemAllowed(fromData.name, toData.combinable.accept)
                ) {
                    $.post(
                        "https://qb-inventory/getCombineItem",
                        JSON.stringify({ item: toData.combinable.reward }),
                        function(item) {
                            $(".combine-option-text").html(
                                "<p>Bu itemleri birleştirirseniz şunları elde edersiniz: <b>" +
                                item.label +
                                "</b></p>"
                            );
                        }
                    );
                    $(".combine-option-container").fadeIn(100);
                    combineslotData = [];
                    combineslotData.fromData = fromData;
                    combineslotData.toData = toData;
                    combineslotData.fromSlot = $fromSlot;
                    combineslotData.toSlot = $toSlot;
                    combineslotData.fromInv = $fromInv;
                    combineslotData.toInv = $toInv;
                    combineslotData.toAmount = $toAmount;
                    return;
                }

                fromData.slot = parseInt($toSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", fromData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");

                if (fromData.name.split("_")[0] == "weapon") {
                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-weapon");
                }  
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + fromData.label + "</p></div>";
                if (fromData.name.split("_")[0] == "weapon") {
                    if (!Inventory.IsWeaponBlocked(fromData.name)) {
                        ItemLabel =
                            '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                            fromData.label +
                            "</p></div>";
                    }
                }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            fromData.amount +
                            ' </p></div>"' +
                            ItemLabel
                        );
                } else if ($toSlot == 41 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            fromData.amount +
                            ' </p></div>"' +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            fromData.amount +
                            ' </p></div>"' +
                            ItemLabel
                        );
                }

                if (fromData.name.split("_")[0] == "weapon") {
                    if (!Inventory.IsWeaponBlocked(fromData.name)) {
                        if (fromData.info.quality == undefined) {
                            fromData.info.quality = 100.0;
                        }
                        var QualityColor = "rgb(39, 174, 96)";
                        if (fromData.info.quality < 25) {
                            QualityColor = "rgb(192, 57, 43)";
                        } else if (
                            fromData.info.quality > 25 &&
                            fromData.info.quality < 50
                        ) {
                            QualityColor = "rgb(230, 126, 34)";
                        } else if (fromData.info.quality >= 50) {
                            QualityColor = "rgb(39, 174, 96)";
                        }
                        if (fromData.info.quality !== undefined) {
                            qualityLabel = fromData.info.quality.toFixed();
                        } else {
                            qualityLabel = fromData.info.quality;
                        }
                        if (fromData.info.quality == 0) {
                            qualityLabel = "Bozuldu";
                        }
                        $toInv
                            .find("[data-slot=" + $toSlot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: qualityLabel + "%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    }
                }

                if (toData != undefined) {
                    toData.slot = parseInt($fromSlot);

                    $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .removeClass("item-nodrag");

                    $fromInv.find("[data-slot=" + $fromSlot + "]").data("item", toData);

                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + toData.label + "</p></div>";
                    if (toData.name.split("_")[0] == "weapon") {
                        if (!Inventory.IsWeaponBlocked(toData.name)) {
                            ItemLabel =
                                '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                                toData.label +
                                "</p></div>";
                        }
                    }

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"><img src="images/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                toData.amount +
                                ' </p></div>"' +
                                ItemLabel
                            );
                    } else if (
                        $fromSlot == 41 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                toData.amount +
                                ' </p></div>"' +
                                ItemLabel
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                toData.amount +
                                ' </p></div>"' +
                                ItemLabel
                            );
                    }

                    if (toData.name.split("_")[0] == "weapon") {
                        if (!Inventory.IsWeaponBlocked(toData.name)) {
                            if (toData.info.quality == undefined) {
                                toData.info.quality = 100.0;
                            }
                            var QualityColor = "rgb(39, 174, 96)";
                            if (toData.info.quality < 25) {
                                QualityColor = "rgb(192, 57, 43)";
                            } else if (toData.info.quality > 25 && toData.info.quality < 50) {
                                QualityColor = "rgb(230, 126, 34)";
                            } else if (toData.info.quality >= 50) {
                                QualityColor = "rgb(39, 174, 96)";
                            }
                            if (toData.info.quality !== undefined) {
                                qualityLabel = toData.info.quality.toFixed();
                            } else {
                                qualityLabel = toData.info.quality;
                            }
                            if (toData.info.quality == 0) {
                                qualityLabel = "Bozuldu";
                            }
                            $fromInv
                                .find("[data-slot=" + $fromSlot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: qualityLabel + "%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        }
                    }

                    $.post(
                        "https://qb-inventory/SetInventoryData",
                        JSON.stringify({
                            fromInventory: $fromInv.attr("data-inventory"),
                            toInventory: $toInv.attr("data-inventory"),
                            fromSlot: $fromSlot,
                            toSlot: $toSlot,
                            fromAmount: $toAmount,
                            toAmount: toData.amount,
                        })
                    );
                } else {
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .removeClass("item-drag");
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .removeClass("item-weapon");
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .addClass("item-nodrag");

                    $fromInv.find("[data-slot=" + $fromSlot + "]").removeData("item");

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    } else if (
                        $fromSlot == 41 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    }

                    $.post(
                        "https://qb-inventory/SetInventoryData",
                        JSON.stringify({
                            fromInventory: $fromInv.attr("data-inventory"),
                            toInventory: $toInv.attr("data-inventory"),
                            fromSlot: $fromSlot,
                            toSlot: $toSlot,
                            fromAmount: $toAmount,
                        })
                    );
                }
                $.post("https://qb-inventory/PlayDropSound", JSON.stringify({}));
            } else if (
                fromData.amount > $toAmount &&
                (toData == undefined || toData == null)
            ) {
                var newDataTo = [];
                newDataTo.name = fromData.name;
                newDataTo.label = fromData.label;
                newDataTo.amount = parseInt($toAmount);
                newDataTo.type = fromData.type;
                newDataTo.description = fromData.description;
                newDataTo.image = fromData.image;
                newDataTo.weight = fromData.weight;
                newDataTo.info = fromData.info;
                newDataTo.useable = fromData.useable;
                newDataTo.unique = fromData.unique;
                newDataTo.slot = parseInt($toSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newDataTo);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                if (fromData.name.split("_")[0] == "weapon") {
                    $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-weapon");
                    }  
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + newDataTo.label + "</p></div>";
                if (newDataTo.name.split("_")[0] == "weapon") {
                    if (!Inventory.IsWeaponBlocked(newDataTo.name)) {
                        ItemLabel =
                            '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                            newDataTo.label +
                            "</p></div>";
                    }
                }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataTo.amount +
                            '</p></div>"' +
                            ItemLabel
                        );
                } else if ($toSlot == 41 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataTo.amount +
                            ' </p></div>"' +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataTo.amount +
                            ' </p></div>"' +
                            ItemLabel
                        );
                }

                if (newDataTo.name.split("_")[0] == "weapon") {
                    if (!Inventory.IsWeaponBlocked(newDataTo.name)) {
                        if (newDataTo.info.quality == undefined) {
                            newDataTo.info.quality = 100.0;
                        }
                        var QualityColor = "rgb(39, 174, 96)";
                        if (newDataTo.info.quality < 25) {
                            QualityColor = "rgb(192, 57, 43)";
                        } else if (
                            newDataTo.info.quality > 25 &&
                            newDataTo.info.quality < 50
                        ) {
                            QualityColor = "rgb(230, 126, 34)";
                        } else if (newDataTo.info.quality >= 50) {
                            QualityColor = "rgb(39, 174, 96)";
                        }
                        if (newDataTo.info.quality !== undefined) {
                            qualityLabel = newDataTo.info.quality.toFixed();
                        } else {
                            qualityLabel = newDataTo.info.quality;
                        }
                        if (newDataTo.info.quality == 0) {
                            qualityLabel = "Bozuldu";
                        }
                        $toInv
                            .find("[data-slot=" + $toSlot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: qualityLabel + "%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    }
                }

                var newDataFrom = [];
                newDataFrom.name = fromData.name;
                newDataFrom.label = fromData.label;
                newDataFrom.amount = parseInt(fromData.amount - $toAmount);
                newDataFrom.type = fromData.type;
                newDataFrom.description = fromData.description;
                newDataFrom.image = fromData.image;
                newDataFrom.weight = fromData.weight;
                newDataFrom.price = fromData.price;
                newDataFrom.info = fromData.info;
                newDataFrom.useable = fromData.useable;
                newDataFrom.unique = fromData.unique;
                newDataFrom.slot = parseInt($fromSlot);

                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .data("item", newDataFrom);

                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                if (fromData.name.split("_")[0] == "weapon") {
                    $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-weapon");
                    }  
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .removeClass("item-nodrag");

                if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newDataFrom.image +
                            '" alt="' +
                            newDataFrom.name +
                            '" /></div><div class="item-slot-amount"><p>(' +
                            newDataFrom.amount +
                            ") $" +
                            newDataFrom.price +
                            '</p></div><div class="item-slot-label"><p>' +
                            newDataFrom.label +
                            "</p></div>"
                        );
                } else {
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' +
                        newDataFrom.label +
                        "</p></div>";
                    if (newDataFrom.name.split("_")[0] == "weapon") {
                        if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                            ItemLabel =
                                '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                                newDataFrom.label +
                                "</p></div>";
                        }
                    }

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</p></div>"' +
                                ItemLabel
                            );
                    } else if (
                        $fromSlot == 41 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</p></div>"' +
                                ItemLabel
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                ' </p></div>"' +
                                ItemLabel
                            );
                    }

                    if (newDataFrom.name.split("_")[0] == "weapon") {
                        if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                            if (newDataFrom.info.quality == undefined) {
                                newDataFrom.info.quality = 100.0;
                            }
                            var QualityColor = "rgb(39, 174, 96)";
                            if (newDataFrom.info.quality < 25) {
                                QualityColor = "rgb(192, 57, 43)";
                            } else if (
                                newDataFrom.info.quality > 25 &&
                                newDataFrom.info.quality < 50
                            ) {
                                QualityColor = "rgb(230, 126, 34)";
                            } else if (newDataFrom.info.quality >= 50) {
                                QualityColor = "rgb(39, 174, 96)";
                            }
                            if (newDataFrom.info.quality !== undefined) {
                                qualityLabel = newDataFrom.info.quality.toFixed();
                            } else {
                                qualityLabel = newDataFrom.info.quality;
                            }
                            if (newDataFrom.info.quality == 0) {
                                qualityLabel = "Bozuldu";
                            }
                            $fromInv
                                .find("[data-slot=" + $fromSlot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: qualityLabel + "%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        }
                    }
                }
                $.post("https://qb-inventory/PlayDropSound", JSON.stringify({}));
                $.post(
                    "https://qb-inventory/SetInventoryData",
                    JSON.stringify({
                        fromInventory: $fromInv.attr("data-inventory"),
                        toInventory: $toInv.attr("data-inventory"),
                        fromSlot: $fromSlot,
                        toSlot: $toSlot,
                        fromAmount: $toAmount,
                    })
                );
            } else {
                InventoryError($fromInv, $fromSlot);
            }
        }
    } else {
    }
    handleDragDrop();
}

function isItemAllowed(item, allowedItems) {
    var retval = false;
    $.each(allowedItems, function(index, i) {
        if (i == item) {
            retval = true;
        }
    });
    return retval;
}

function InventoryError($elinv, $elslot) {
    $elinv
        .find("[data-slot=" + $elslot + "]")
        .css("background", "rgba(156, 20, 20, 0.5)")
        .css("transition", "background 500ms");
    setTimeout(function() {
        $elinv
            .find("[data-slot=" + $elslot + "]")
            .css("background", "rgba(255, 255, 255, 0.3)");
    }, 500);
    $.post("https://qb-inventory/PlayDropFail", JSON.stringify({}));
}

var requiredItemOpen = false;

(() => {
    Inventory = {};

    Inventory.slots = 40;

    Inventory.dropslots = 20;
    Inventory.droplabel = "Ground";
    Inventory.dropmaxweight = 100000;

    Inventory.Error = function() {
        $.post("https://qb-inventory/PlayDropFail", JSON.stringify({}));
    };

    Inventory.IsWeaponBlocked = function(WeaponName) {
        var DurabilityBlockedWeapons = [
            "weapon_unarmed",
        ];

        var retval = false;
        $.each(DurabilityBlockedWeapons, function(i, name) {
            if (name == WeaponName) {
                retval = true;
            }
        });
        return retval;
    };

    Inventory.QualityCheck = function(item, IsHotbar, IsOtherInventory) {
        if (!Inventory.IsWeaponBlocked(item.name)) {
            if (item.name.split("_")[0] == "weapon") {
                if (item.info.quality == undefined) {
                    item.info.quality = 100;
                }
                var QualityColor = "rgb(39, 174, 96)";
                if (item.info.quality < 25) {
                    QualityColor = "rgb(192, 57, 43)";
                } else if (item.info.quality > 25 && item.info.quality < 50) {
                    QualityColor = "rgb(230, 126, 34)";
                } else if (item.info.quality >= 50) {
                    QualityColor = "rgb(39, 174, 96)";
                }
                if (item.info.quality !== undefined) {
                    qualityLabel = item.info.quality.toFixed();
                } else {
                    qualityLabel = item.info.quality;
                }
                if (item.info.quality == 0) {
                    qualityLabel = "Bozuldu";
                    if (!IsOtherInventory) {
                        if (!IsHotbar) {
                            $(".player-inventory")
                                .find("[data-slot=" + item.slot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: "100%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        } else {
                            $(".z-hotbar-inventory")
                                .find("[data-zhotbarslot=" + item.slot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: "100%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        }
                    } else {
                        $(".other-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: "100%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    }
                } else {
                    if (!IsOtherInventory) {
                        if (!IsHotbar) {
                            $(".player-inventory")
                                .find("[data-slot=" + item.slot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: qualityLabel + "%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        } else {
                            $(".z-hotbar-inventory")
                                .find("[data-zhotbarslot=" + item.slot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: qualityLabel + "%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        }
                    } else {
                        $(".other-inventory")
                        
                            .find("[data-slot=" + item.slot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: qualityLabel + "%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    }
                }
            }
        }
    };

    Inventory.Open = function(data) {
        $(".spine, .head , .left-arm, .right-arm, .left-leg, .right-leg").fadeOut(0)
        for (const bone in data.DamagedBones) {
            $(`.${bone}`).fadeIn(200);
        }

        totalWeight = 0;
        totalWeightOther = 0;

        $(".avatarname").html(data.Name);
        $(".phonenr").html(data.Phone);
        $(".jobname").html(data.Jobname);
        $(".banka").html(data.Bank);

        $(".player-inventory").find(".item-slot").remove();
        $(".ply-hotbar-inventory").find(".item-slot").remove();

        if (requiredItemOpen) {
            $(".requiredItem-container").hide();
            requiredItemOpen = false;
        }



        $("#qbcore-inventory").fadeIn(300);
        if (data.other != null && data.other != "") {
            $(".other-inventory").attr("data-inventory", data.other.name);
        } else {
            $(".other-inventory").attr("data-inventory", 0);
        }
        for (i = 1; i < 6; i++) {
            $(".player-inventory").append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-key"><p>' +
                i +
                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
            );
        }
        for (i = 6; i < data.slots; i++) {
            if (i == 41) {
                $(".player-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            } else {
                $(".player-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        }

        if (data.other != null && data.other != "") {
            for (i = 1; i < data.other.slots + 1; i++) {
                $(".other-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        } else {
            for (i = 1; i < Inventory.dropslots + 1; i++) {
                $(".other-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
            $(".other-inventory .item-slot").css({
                "background-color": "rgba(222, 226, 230, 0.06)",
            });
        }

        if (data.inventory !== null) {
            $.each(data.inventory, function(i, item) {
                if (item != null) {
                    totalWeight += item.weight * item.amount;
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + item.label + "</p></div>";
                    if (item.name.split("_")[0] == "weapon") {
                        $(".player-inventory") .find("[data-slot=" + item.slot + "]").addClass("item-weapon");
                        if (!Inventory.IsWeaponBlocked(item.name)) {
                            ItemLabel =
                                '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                                item.label +
                                "</p></div>";

                        }
                    }
                    if (item.slot < 6) {
                        if (item.name.split("_")[0] == "weapon") {
                            $(".player-inventory") .find("[data-slot=" + item.slot + "]").addClass("item-weapon");
                        }
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .addClass("item-drag");
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                item.slot +
                                '</p></div><div class="item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                item.amount +
                                ' </p></div>"' +
                                ItemLabel
                            );
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .data("item", item);
                    } else if (item.slot == 41) {
                        if (item.name.split("_")[0] == "weapon") {
                            $(".player-inventory") .find("[data-slot=" + item.slot + "]").addClass("item-weapon");
                        }
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .addClass("item-drag");
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                item.amount +
                                ' </p></div>"' +
                                ItemLabel
                            );
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .data("item", item);
                    } else {
                        if (item.name.split("_")[0] == "weapon") {
                            $(".player-inventory") .find("[data-slot=" + item.slot + "]").addClass("item-weapon");
                        }
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .addClass("item-drag");
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                item.amount +
                                "</p></div>" +
                                ItemLabel
                            );
                        $(".player-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .data("item", item);
                    }
                    Inventory.QualityCheck(item, false, false);
                }
            });
        }

        if (
            data.other != null &&
            data.other != "" &&
            data.other.inventory != null
        ) {
            $.each(data.other.inventory, function(i, item) {
                if (item != null) {
                    totalWeightOther += item.weight * item.amount;
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + item.label + "</p></div>";
                    if (item.name.split("_")[0] == "weapon") {
                        if (!Inventory.IsWeaponBlocked(item.name)) {
                            ItemLabel =
                                '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                                item.label +
                                "</p></div>";
                        }
                    }
                    if (item.name.split("_")[0] == "weapon") {
                        $(".other-inventory") .find("[data-slot=" + item.slot + "]").addClass("item-weapon");
                    }
                    $(".other-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    if (item.price != null) {
                        $(".other-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>(' +
                                item.amount +
                                ") $" +
                                item.price +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $(".other-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                item.amount +
                                ' </p></div>"' +
                                ItemLabel
                            );
                    }
                    $(".other-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                    Inventory.QualityCheck(item, false, true);
                }
            });
        }

        $("#player-inv-weight").html(
            "<b> " +
            (totalWeight / 1000).toFixed(2) +
            "</b>/<span>" +
            (data.maxweight / 1000) + " kg</span>"
        );

        Percentages = ((data.maxweight / 1000) / 100) * (totalWeight / 1000);

        $(".player-weight-bar").css({
            width: Percentages + "%",
        });
        playerMaxWeight = data.maxweight;
        if (data.other != null) {
            var name = data.other.name.toString();
            if (
                name != null &&
                (name.split("-")[0] == "itemshop" || name == "crafting")
            ) {
                $("#other-inv-label").html(data.other.label);
            } else {
                $("#other-inv-label").html(data.other.label);
                $("#other-inv-weight").html(
                    "<b> " +
                    (totalWeightOther / 1000).toFixed(2) +
                    "</b>/<span>" +
                    (data.other.maxweight / 1000).toFixed(2) + " kg</span>"
                );
            }
            otherMaxWeight = data.other.maxweight;
            otherLabel = data.other.label;
        } else {
            $("#other-inv-label").html(Inventory.droplabel);
            $("#other-inv-weight").html(
                "<b> " +
                (totalWeight / 1000).toFixed(2) +
                "</b>/<span>" +
                (data.maxweight / 1000) + " kg</span>"
            );
            otherMaxWeight = Inventory.dropmaxweight;
            otherLabel = Inventory.droplabel;
        }

        $.each(data.maxammo, function(index, ammotype) {
            $("#" + index + "_ammo")
                .find(".ammo-box-amount")
                .css({ height: "0%" });
        });

        if (data.Ammo !== null) {
            $.each(data.Ammo, function(i, amount) {
                var Handler = i.split("_");
                var Type = Handler[1].toLowerCase();
                if (amount > data.maxammo[Type]) {
                    amount = data.maxammo[Type];
                }
                var Percentage = (amount / data.maxammo[Type]) * 100;

                $("#" + Type + "_ammo")
                    .find(".ammo-box-amount")
                    .css({ height: Percentage + "%" });
                $("#" + Type + "_ammo")
                    .find("span")
                    .html(amount + "x");
            });
        }

        handleDragDrop();
    };

    Inventory.Close = function() {
        $(".ply-hotbar-inventory").css("display", "block");
        $(".ply-iteminfo-container").css("display", "none");
        $("#qbcore-inventory").fadeOut(300);
        $(".combine-option-container").hide();
        $(".item-slot").remove();
        if ($("#rob-money").length) {
            $("#rob-money").remove();
        }
        $.post("https://qb-inventory/CloseInventory", JSON.stringify({}));

        if (AttachmentScreenActive) {
            $("#qbcore-inventory").css({ left: "0vw" });
            $(".weapon-attachments-container").css({ left: "-100vw" });
            AttachmentScreenActive = false;
        }

        if (ClickedItemData !== null) {
            $("#weapon-attachments").fadeOut(250, function() {
                $("#weapon-attachments").remove();
                ClickedItemData = {};
            });
        }
    };

    Inventory.Update = function(data) {
        totalWeight = 0;
        totalWeightOther = 0;
        $(".player-inventory").find(".item-slot").remove();
        $(".ply-hotbar-inventory").find(".item-slot").remove();
        if (data.error) {
            Inventory.Error();
        }
        for (i = 1; i < data.slots + 1; i++) {
            if (i == 41) {
                $(".player-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            } else {
                $(".player-inventory").append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        }

        $.each(data.inventory, function(i, item) {
            if (item != null) {
                totalWeight += item.weight * item.amount;
                if (item.slot < 6) {
                    if (item.name.split("_")[0] == "weapon") {
                        $(".player-inventory") .find("[data-slot=" + item.slot + "]").addClass("item-weapon");
                    }
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            item.slot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</p></div><div class="item-slot-label"><p>' +
                            item.label +
                            "</p></div>"
                        );
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                } else if (item.slot == 41) {
                    if (item.name.split("_")[0] == "weapon") {
                        $(".player-inventory") .find("[data-slot=" + item.slot + "]").addClass("item-weapon");
                    }
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</p></div><div class="item-slot-label"><p>' +
                            item.label +
                            "</p></div>"
                        );
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                } else {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</p></div><div class="item-slot-label"><p>' +
                            item.label +
                            "</p></div>"
                        );
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                }
            }
        });

        Percentages = ((data.maxweight / 1000) / 100) * totalWeight;

        $(".player-weight-bar").css({
            width: Percentages + "%",
        });

        $("#player-inv-weight").html(
            "<b>" +
            (totalWeight / 1000).toFixed(2) +
            "</b>/<span>" +
            (data.maxweight / 1000) + " kg</span>"
        );

        handleDragDrop();
    };

    Inventory.ToggleHotbar = function(data) {
        if (data.open) {
            $(".z-hotbar-inventory").html("");
            for (i = 1; i < 6; i++) {
                var elem =
                    '<div class="z-hotbar-item-slot" data-zhotbarslot="' +
                    i +
                    '"> <div class="z-hotbar-item-slot-key"><p>' +
                    i +
                    '</p></div><div class="z-hotbar-item-slot-img"></div><div class="z-hotbar-item-slot-label"><p>&nbsp;</p></div></div>';
                $(".z-hotbar-inventory").append(elem);
            }
/*             var elem =
                '<div class="z-hotbar-item-slot" data-zhotbarslot="41"> <div class="z-hotbar-item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="z-hotbar-item-slot-img"></div><div class="z-hotbar-item-slot-label"><p>&nbsp;</p></div></div>';
            $(".z-hotbar-inventory").append(elem); */
            $.each(data.items, function(i, item) {
                if (item != null) {
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + item.label + "</p></div>";
                    if (item.name.split("_")[0] == "weapon") {
                        if (!Inventory.IsWeaponBlocked(item.name)) {
                            ItemLabel =
                                '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                                item.label +
                                "</p></div>";
                        }
                    }
                    if (item.slot == 41) {
                        $(".z-hotbar-inventory")
                            .find("[data-zhotbarslot=" + item.slot + "]")
                            .html(
                                '<div class="z-hotbar-item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="z-hotbar-item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="z-hotbar-item-slot-amount"><p>' +
                                item.amount +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $(".z-hotbar-inventory")
                            .find("[data-zhotbarslot=" + item.slot + "]")
                            .html(
                                '<div class="z-hotbar-item-slot-key"><p>' +
                                item.slot +
                                '</p></div><div class="z-hotbar-item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="z-hotbar-item-slot-amount"><p>' +
                                item.amount +
                                "</p></div>" +
                                ItemLabel
                            );
                    }
                    Inventory.QualityCheck(item, true, false);
                }
            });
            $(".z-hotbar-inventory").fadeIn(150);
        } else {
            $(".z-hotbar-inventory").fadeOut(150, function() {
                $(".z-hotbar-inventory").html("");
            });
        }
    };

    Inventory.UseItem = function(data) {
        $(".itembox-container").hide();
        $(".itembox-container").fadeIn(250);
        $("#itembox-action").html("<p>Used</p>");
        $("#itembox-label").html("<p>" + data.item.label + "</p>");
        $("#itembox-image").html(
            '<div class="item-slot-img"><img src="images/' +
            data.item.image +
            '" alt="' +
            data.item.name +
            '" /></div>'
        );
        setTimeout(function() {
            $(".itembox-container").fadeOut(250);
        }, 2000);
    };

    var itemBoxtimer = null;
    var requiredTimeout = null;

    Inventory.itemBox = function(data) {
        if (itemBoxtimer !== null) {
            clearTimeout(itemBoxtimer);
        }
        var type = "Used";
        if (data.type == "add") {
            type = "Received";
        } else if (data.type == "remove") {
            type = "Deleted";
        }

        var $itembox = $(".itembox-container.template").clone();
        $itembox.removeClass("template");
        $itembox.html(
            '<div id="itembox-action"><p>' +
            type +
            '</p></div><div id="itembox-label"><p>' +
            data.item.label +
            '</p></div><div class="item-slot-img"><img src="images/' +
            data.item.image +
            '" alt="' +
            data.item.name +
            '" /></div>'
        );
        $(".itemboxes-container").prepend($itembox);
        $itembox.fadeIn(250);
        setTimeout(function() {
            $.when($itembox.fadeOut(300)).done(function() {
                $itembox.remove();
            });
        }, 3000);
    };

    Inventory.RequiredItem = function(data) {
        if (requiredTimeout !== null) {
            clearTimeout(requiredTimeout);
        }
        if (data.toggle) {
            if (!requiredItemOpen) {
                $(".requiredItem-container").html("");
                $.each(data.items, function(index, item) {
                    var element =
                        '<div class="requiredItem-box"><div id="requiredItem-action">Gerekli</div><div id="requiredItem-label"><p>' +
                        item.label +
                        '</p></div><div id="requiredItem-image"><div class="item-slot-img"><img src="images/' +
                        item.image +
                        '" alt="' +
                        item.name +
                        '" /></div></div></div>';
                    $(".requiredItem-container").hide();
                    $(".requiredItem-container").append(element);
                    $(".requiredItem-container").fadeIn(100);
                });
                requiredItemOpen = true;
            }
        } else {
            $(".requiredItem-container").fadeOut(100);
            requiredTimeout = setTimeout(function() {
                $(".requiredItem-container").html("");
                requiredItemOpen = false;
            }, 100);
        }
    };

    window.onload = function(e) {
        window.addEventListener("message", function(event) {
            switch (event.data.action) {
                case "open":
                    Inventory.Open(event.data);
                    break;
                case "close":
                    Inventory.Close();
                    break;
                case "update":
                    Inventory.Update(event.data);
                    break;
                case "itemBox":
                    Inventory.itemBox(event.data);
                    break;
                case "requiredItem":
                    Inventory.RequiredItem(event.data);
                    break;
                case "toggleHotbar":
                    Inventory.ToggleHotbar(event.data);
                    break;
                case "RobMoney":
                    $(".inv-options-list").append(
                        '<div class="inv-option-item" id="rob-money"><p>Para Al</p></div>'
                    );
                    $("#rob-money").data("TargetId", event.data.TargetId);
                    break;
            }
        });
    };
})();

$(document).on("click", "#rob-money", function(e) {
    e.preventDefault();
    var TargetId = $(this).data("TargetId");
    $.post(
        "https://qb-inventory/RobMoney",
        JSON.stringify({
            TargetId: TargetId,
        })
    );
    $("#rob-money").remove();
});

$("#item-give").droppable({
    hoverClass: "button-hover",
    drop: function(event, ui) {
        setTimeout(function() {
            IsDragging = false;
        }, 300);
        fromData = ui.draggable.data("item");
        fromInventory = ui.draggable.parent().attr("data-inventory");
        amount = $("#item-amount").val();
        if (amount == 0) {
            amount = fromData.amount;
        }
        $.post(
            "https://qb-inventory/GiveItem",
            JSON.stringify({
                inventory: fromInventory,
                item: fromData,
                amount: parseInt(amount),
            })
        );
    },
});


