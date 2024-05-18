"use strict";
const svg1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg1.setAttribute("class", "loader");
const circle1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
circle1.setAttribute("cx", "30");
circle1.setAttribute("cy", "30");
circle1.setAttribute("r", "30");
svg1.appendChild(circle1);
const divLoader = document.createElement("div");
divLoader.className = "loading-container d-flex justify-center align-center";
const userOnlineSpan = document.querySelector(".chat-header .header-container-text-chat span");
const resultsUsersDiv = document.querySelector(".results-users");
const chatDiv = document.querySelector(".chat");
const messagesDiv = document.querySelector(".messages");
const uploadFileInput = document.querySelector("#file-upload");
const pfpImage = document.querySelector(".sidebar div .profile-picture");
const chatUserOptions = document.querySelector(".chat .chat-header .container-icon-tools #user-options");
const chatUserOptionsContainer = document.querySelector(".chat .chat-header .container-icon-tools #user-options .options-user-container");
const mainUserOptions = document.querySelector(".main-user-options .icon-dots");
const menuUserOptions = document.querySelector(".main-user-options .menu-user-options");
const menuUserOptionsSignOut = document.querySelector(".main-user-options .menu-user-options .sign-out-btn");
const deleteAccountBtn = document.querySelector(".main-user-options .menu-user-options .delete-account-btn");
let mainUserNameTextContent = "";
let mainUserDisplayNameTextContent = "";
let mainUserBioTextContent = "";
const formMessage = document.querySelector(".chat form");
const inputSendMessage = document.querySelector('.input-container textarea[name="name"]');
inputSendMessage?.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const submitEvent = new Event("submit", { cancelable: true });
        formMessage?.dispatchEvent(submitEvent);
    }
});
inputSendMessage?.addEventListener("keyup", function (event) {
    if (event.target instanceof HTMLTextAreaElement) {
        inputSendMessage.style.height = "50px";
        let scrollHeight = event.target.scrollHeight;
        inputSendMessage.style.height = `${scrollHeight}px`;
    }
});
const session_key = localStorage.getItem("session_key");
const setUsersId = new Set();
let userId = -1;
let chatGuestId = -1;
let chatId = -1;
window.onbeforeunload = () => {
    ws.close();
};
const ws = new WebSocket("ws://localhost:8080");
ws.onopen = () => {
    console.log("WebSocket connection established.");
};
ws.onmessage = (event) => {
    const messageJson = JSON.parse(event.data);
    if (messageJson && messageJson.type === "init") {
        //console.log(messageJson);
    }
    else if (messageJson && messageJson.type === "message") {
        //console.log(messageJson);
        const messageDateSent = messageJson.dateSent;
        const senderId = Number(messageJson.senderId);
        const guestId = Number(messageJson.guestId);
        if (!Array.from(setUsersId).some((userChatId) => {
            return userChatId === senderId;
        })) {
            setUsersId.add(senderId);
            getPreviousChats();
        }
        dynamicFetchMessages(messageDateSent, senderId, guestId);
    }
    else if (messageJson && messageJson.type === "seen") {
        const chatIdRes = Number(messageJson.chatId);
        if (chatId === chatIdRes) {
            const messageContainerDivs = document.querySelectorAll(".chat .messages .message-container.sent");
            if (messageContainerDivs.length > 0) {
                messageContainerDivs.forEach((div) => {
                    div.classList.remove("sent");
                    div.classList.add("seen");
                });
            }
        }
    }
    else if (messageJson && messageJson.type === "delete") {
        const messageId = Number(messageJson.messageId);
        let messagesContainers = document.querySelectorAll(".chat .messages .message-container");
        for (let i = 0; i < messagesContainers.length; i++) {
            let div = messagesContainers[i];
            let messageIdDiv = div.getAttribute("id");
            if (messageId === Number(messageIdDiv)) {
                div.remove();
                if (div.querySelector(".message-pfp-container .message-user-profile-picture")) {
                    const chatUserPfpUrl = document
                        .querySelector(".chat .chat-header .picture-chat")
                        ?.getAttribute("src");
                    const previousDivMessage = messagesContainers[i + 1];
                    const pfpContainerDiv = previousDivMessage?.querySelector(".message-pfp-container");
                    if (previousDivMessage?.classList.contains("message-other") &&
                        pfpContainerDiv) {
                        const chatUserImg = document.createElement("img");
                        chatUserImg.classList.add("message-user-profile-picture");
                        chatUserImg.setAttribute("src", chatUserPfpUrl ?? "");
                        chatUserImg.setAttribute("alt", "profile picture");
                        pfpContainerDiv?.appendChild(chatUserImg);
                    }
                }
            }
        }
    }
    else if (messageJson && messageJson.type === "online") {
        if (messageJson.online && userOnlineSpan) {
            userOnlineSpan.textContent = "online";
            userOnlineSpan.classList.remove("muted");
        }
        else if (userOnlineSpan) {
            userOnlineSpan.textContent = "offline";
            userOnlineSpan.classList.add("muted");
        }
    }
    else if (messageJson && messageJson.type === "setUsers") {
        if (messageJson.response &&
            messageJson.online &&
            userOnlineSpan &&
            chatGuestId === messageJson.senderId) {
            userOnlineSpan.textContent = "online";
            userOnlineSpan.classList.remove("muted");
        }
        else if (messageJson.response &&
            !messageJson.online &&
            userOnlineSpan &&
            chatGuestId === messageJson.senderId) {
            userOnlineSpan.textContent = "offline";
            userOnlineSpan.classList.add("muted");
        }
        else if (messageJson.request && messageJson.online && userOnlineSpan) {
            userOnlineSpan.textContent = "online";
            userOnlineSpan.classList.remove("muted");
        }
        else if (messageJson.request && !messageJson.online && userOnlineSpan) {
            userOnlineSpan.textContent = "offline";
            userOnlineSpan.classList.add("muted");
        }
    }
    else if (messageJson && messageJson.type === "editedMessage") {
        const messageId = Number(messageJson.messageId);
        const textEditedMessage = messageJson.content;
        let messagesContainers = document.querySelectorAll(".chat .messages .message-container");
        messagesContainers.forEach((div) => {
            const messageTextSpan = div.querySelector(".messageUpperContainer .span-message .text-content");
            const editedLabelText = div.querySelector(".messageLowerContainer .edited-label-message");
            let messageIdDiv = div.getAttribute("id");
            if (messageId === Number(messageIdDiv) && messageTextSpan) {
                messageTextSpan.textContent = textEditedMessage;
                editedLabelText?.classList.remove("d-none");
                editedLabelText?.classList.add("d-inline");
            }
        });
    }
};
ws.onerror = (error) => {
    console.error("WebSocket error:", error);
};
ws.onclose = () => {
    console.log("WebSocket connection closed.");
};
async function checkUserSessionKey() {
    try {
        const response = await fetch("http://localhost:8080/session/validate", {
            method: "POST",
            headers: {
                "Content-Type": "text/plain",
            },
            body: session_key,
        });
        const jsonRes = await response.text();
        const responseBody = JSON.parse(jsonRes);
        if (response.ok) {
            //console.log("Response body:", responseBody);
            //console.log(response.status);
            if (response.status == 200) {
                //console.log("key checked");
                userId = Number(responseBody.id);
                if (userId > 0) {
                    const userIdObject = {
                        type: "init",
                        userId: userId,
                    };
                    ws.send(JSON.stringify(userIdObject));
                    updateMainUserData(responseBody.name, responseBody.pfp, responseBody.display_name, responseBody.bio);
                    getPreviousChats();
                }
            }
            else {
                //console.log("Response body:", responseBody);
                console.log(response.status);
                window.location.href = "../pages/sign_in.html";
            }
        }
        else {
            //console.log("Response body:", responseBody);
            console.log(response.status);
            window.location.href = "../pages/sign_in.html";
        }
    }
    catch (error) {
        window.location.href = "../pages/sign_in.html";
        console.log(error);
    }
}
checkUserSessionKey();
const searchUserInput = document.querySelector("#search-user");
let timeoutId;
searchUserInput?.addEventListener("input", (event) => {
    if (event.target instanceof HTMLInputElement) {
        clearTimeout(timeoutId);
        let query = event.target.value;
        timeoutId = setTimeout(() => {
            if (query.length > 0) {
                searchUser(query);
            }
        }, 300);
        if (query.length == 0) {
            if (resultsUsersDiv) {
                resultsUsersDiv.textContent = "";
            }
            getPreviousChats();
        }
    }
});
function scrollToBottom() {
    if (messagesDiv) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}
function updateMainUserData(name, pfp = undefined, display_name = name, bio = undefined) {
    if (pfp != null && pfp.type === "image") {
        document
            .querySelector(".menu-profile .container-modal label .menu-profile-picture")
            ?.setAttribute?.("src", pfp.content);
        pfpImage?.setAttribute("src", pfp.content);
    }
    else if (pfp != null && pfp.type === "none") {
        ("silence is gold");
    }
    else {
        pfpImage?.setAttribute("src", "../img/default-avatar-profile-icon-social.webp");
        document
            .querySelector(".menu-profile .container-modal label .menu-profile-picture")
            ?.setAttribute?.("src", "../img/default-avatar-profile-icon-social.webp");
    }
    let mainUserName = document.querySelector(".menu-profile .main-user-name");
    if (name.length > 0) {
        if (mainUserName)
            mainUserName.value = name;
        mainUserNameTextContent = name;
    }
    let mainUserDisplayName = document.querySelector(".menu-profile .main-user-display-name");
    if (display_name.length > 0) {
        if (mainUserDisplayName)
            mainUserDisplayName.value = display_name;
        mainUserDisplayNameTextContent = display_name;
    }
    else if (name.length > 0) {
        if (mainUserDisplayName)
            mainUserDisplayName.value = name;
        mainUserDisplayNameTextContent = name;
    }
    let mainUserBio = document.querySelector(".menu-profile .main-user-bio");
    if (bio != null) {
        if (bio.length > 0) {
            if (mainUserBio)
                mainUserBio.value = bio;
            mainUserBioTextContent = bio;
        }
    }
}
async function uploadPfpImage(fileInput) {
    if (fileInput.files && fileInput) {
        try {
            console.log(fileInput.files[0]);
            const formData = new FormData();
            formData.append("image", fileInput.files[0]);
            formData.append("id", userId.toString());
            const response = await fetch("http://localhost:8080/user/newPfp", {
                method: "POST",
                body: formData,
            });
            const jsonRes = await response.text();
            const responseBody = JSON.parse(jsonRes);
            if (response.ok) {
                //console.log(responseBody);
                const newPFp = responseBody.pfp;
                updateMainUserData("", newPFp);
            }
            else {
                console.log(responseBody);
            }
        }
        catch (error) {
            console.log(error);
        }
    }
}
async function searchUser(query) {
    try {
        const response = await fetch("http://localhost:8080/user/search", {
            method: "POST",
            headers: {
                "Content-Type": "text/plain",
            },
            body: query,
        });
        const responseBody = await response.text();
        if (response.ok) {
            //console.log("Response body:", responseBody);
            let users = JSON.parse(responseBody);
            //console.log(users);
            //console.log(response.status);
            createUsersElements(users, false);
        }
    }
    catch (error) {
        console.log(error);
    }
}
function createUsersElements(users, previous = false) {
    if (resultsUsersDiv?.firstElementChild) {
        resultsUsersDiv.textContent = "";
    }
    users.forEach((user) => {
        const div = document.createElement("div");
        div.id = user.id.toString();
        const textContainer = document.createElement("div");
        textContainer.classList.add("text-div");
        const h1 = document.createElement("h1");
        const span = document.createElement("span");
        textContainer.appendChild(h1);
        const pfp = document.createElement("img");
        pfp.classList.add("pfp");
        div.prepend(pfp);
        div.appendChild(textContainer);
        pfp.setAttribute("src", "../img/default-avatar-profile-icon-social.webp");
        if (user.pfp && user.pfp.type === "image") {
            pfp.setAttribute("src", user.pfp.content ?? "../img/default-avatar-profile-icon-social.webp");
            pfp.setAttribute("alt", "profile picture");
            div.appendChild(pfp);
        }
        if (previous) {
            if (typeof user.display_name === "string" &&
                user.display_name.length > 0) {
                h1.textContent = user.display_name;
            }
            else if (typeof user.name === "string" && user.name.length > 0) {
                h1.textContent = user.name;
            }
            if (user.last_message && user.last_message.length > 0) {
                const spanLastMessage = document.createElement("span");
                spanLastMessage.classList.add("last-message");
                let lastMessage = user.last_message;
                if (lastMessage.length > 18) {
                    lastMessage = lastMessage.slice(0, 18) + "...";
                }
                spanLastMessage.textContent = lastMessage;
                textContainer.appendChild(spanLastMessage);
            }
            if (user.count_unseen && user.count_unseen > 0) {
                const spanCountUnread = document.createElement("span");
                spanCountUnread.classList.add("count-unread");
                spanCountUnread.textContent = user.count_unseen.toString();
                textContainer.appendChild(spanCountUnread);
            }
        }
        else {
            if (typeof user.display_name === "string" &&
                user.display_name.length > 0) {
                h1.textContent = user.display_name;
            }
            else {
                h1.textContent = user.name;
            }
            span.textContent = `@${user.name}`;
            textContainer.appendChild(span);
        }
        textContainer.prepend(h1);
        div.classList.add("user-container");
        div.addEventListener("click", () => {
            let lastMessage = div.querySelector(".last-message");
            if (lastMessage) {
                lastMessage.remove();
            }
            let countUnseen = div.querySelector(".count-unread");
            if (countUnseen) {
                countUnseen.remove();
            }
            if (typeof user.name === "string" &&
                typeof user.display_name === "string" &&
                typeof user.id === "number" &&
                ((user.blocker_id != null && user.blocker_id === userId) ||
                    user.blocker_id == null)) {
                createChat(user.name, user.id, user.pfp?.content ?? "../img/default-avatar-profile-icon-social.webp", user.display_name);
            }
            else if (typeof user.name === "string" &&
                typeof user.id === "number" &&
                ((user.blocker_id != null && user.blocker_id === userId) ||
                    user.blocker_id == null)) {
                createChat(user.name, user.id, user.pfp?.content ?? "../img/default-avatar-profile-icon-social.webp");
            }
        });
        resultsUsersDiv?.appendChild(div);
    });
}
function createChat(name, id, pfpUrl, display_name = name) {
    const form = document.querySelector(".chat form");
    const chatHeader = document.querySelector(".chat-header");
    const inputContainer = document.querySelector(".input-container");
    const textareaBar = document.querySelector('.chat form textarea[name="name"]');
    const userName = chatHeader?.querySelector(".header-container-text-chat h1");
    const blockUserOption = document.querySelector(".chat .chat-header .container-icon-tools #user-options .options-user-container #block-user-option");
    const deleteChatOption = document.querySelector(".chat .chat-header .container-icon-tools #user-options .options-user-container #delete-user-option");
    blockUserOption?.addEventListener("click", createMenuBlockUser);
    deleteChatOption?.addEventListener("click", createMenuDeleteChat);
    function createMenuBlockUser() {
        if (document.querySelector(".menu-block-user")) {
            document.querySelector(".menu-block-user")?.remove();
        }
        if (menuUserOptions?.classList.contains("d-flex")) {
            menuUserOptions?.classList.remove("d-flex");
            menuUserOptions?.classList.add("d-none");
        }
        let menuBlockUser = document.createElement("div");
        menuBlockUser.className = "menu-block-user d-flex";
        let containerModal = document.createElement("div");
        containerModal.className = "container-modal d-flex flex-column";
        let blockUserForm = document.createElement("form");
        blockUserForm.action = "/submit";
        blockUserForm.method = "post";
        blockUserForm.className = "block-user-form d-flex flex-column w-100";
        let checkboxBlockUser = document.createElement("input");
        checkboxBlockUser.type = "checkbox";
        checkboxBlockUser.id = "checkbox-block-user";
        checkboxBlockUser.name = "checkboxBlockUser";
        checkboxBlockUser.checked = true;
        let labelBlockUser = document.createElement("label");
        labelBlockUser.htmlFor = "checkbox-block-user";
        labelBlockUser.textContent = "Block user";
        let checkboxHideChat = document.createElement("input");
        checkboxHideChat.type = "checkbox";
        checkboxHideChat.id = "checkbox-hide-chat";
        checkboxHideChat.name = "checkboxHideChat";
        let labelHideChat = document.createElement("label");
        labelHideChat.htmlFor = "checkbox-hide-chat";
        labelHideChat.textContent = "Hide chat";
        let submitButton = document.createElement("input");
        submitButton.type = "submit";
        submitButton.value = "submit";
        blockUserForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (userId > 0 && id > 0 && checkboxBlockUser && checkboxHideChat) {
                try {
                    const response = await fetch("http://localhost:8080/user/block", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            ownerId: userId,
                            guestId: id,
                            userBlock: checkboxBlockUser.checked,
                            chatHidden: checkboxHideChat.checked,
                        }),
                    });
                    const responseBody = await response.text();
                    if (response.ok) {
                        if (response.status === 200) {
                            //console.log(responseBody);
                        }
                        else {
                            console.log(responseBody);
                        }
                    }
                    else {
                        console.log(responseBody);
                    }
                }
                catch (error) {
                    console.log(error);
                }
            }
        });
        blockUserForm.appendChild(checkboxBlockUser);
        blockUserForm.appendChild(labelBlockUser);
        blockUserForm.appendChild(checkboxHideChat);
        blockUserForm.appendChild(labelHideChat);
        blockUserForm.appendChild(submitButton);
        containerModal.appendChild(blockUserForm);
        let menuBackgroundModal = document.createElement("div");
        menuBackgroundModal.className = "menu-background-modal";
        menuBackgroundModal.addEventListener("click", () => {
            if (menuBlockUser) {
                menuBlockUser.remove();
            }
        });
        menuBlockUser.appendChild(containerModal);
        menuBlockUser.appendChild(menuBackgroundModal);
        document.body.appendChild(menuBlockUser);
    }
    function createMenuDeleteChat() {
        if (document.querySelector(".menu-delete-chat")) {
            document.querySelector(".menu-delete-chat")?.remove();
        }
        if (menuUserOptions?.classList.contains("d-flex")) {
            menuUserOptions?.classList.remove("d-flex");
            menuUserOptions?.classList.add("d-none");
        }
        let menuDeleteChat = document.createElement("div");
        menuDeleteChat.className = "menu-delete-chat d-flex";
        let containerModal = document.createElement("div");
        containerModal.className = "container-modal d-flex flex-column";
        let btnConfirm = document.createElement("button");
        btnConfirm.className = "btn-confirm";
        btnConfirm.textContent = "Delete chat";
        btnConfirm.addEventListener("click", async () => {
            if (userId > 0 && id > 0) {
                try {
                    const response = await fetch("http://localhost:8080/chats/delete", {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ ownerId: userId, guestId: id }),
                    });
                    const responseBody = await response.text();
                    if (response.ok) {
                        if (response.status === 200) {
                            //console.log(responseBody);
                            chatHeader?.classList.add("d-none");
                            if (messagesDiv)
                                messagesDiv.textContent = "";
                            inputContainer?.classList.add("d-none");
                            if (menuDeleteChat)
                                menuDeleteChat.remove();
                            deleteChatOption?.removeEventListener("click", createMenuDeleteChat);
                            blockUserOption?.removeEventListener("click", createMenuBlockUser);
                            document
                                .querySelectorAll(".sidebar .user-container")
                                .forEach((div) => Number(div.id) === id ? div.remove() : null);
                        }
                        else {
                            //console.log(responseBody);
                            if (menuDeleteChat)
                                menuDeleteChat.remove();
                        }
                    }
                    else {
                        //console.log(responseBody);
                        if (menuDeleteChat)
                            menuDeleteChat.remove();
                    }
                }
                catch (error) {
                    console.log(error);
                    if (menuDeleteChat)
                        menuDeleteChat.remove();
                }
            }
        });
        let btnCancel = document.createElement("button");
        btnCancel.className = "btn-cancel";
        btnCancel.textContent = "Cancel";
        btnCancel.addEventListener("click", () => {
            if (menuDeleteChat) {
                menuDeleteChat.remove();
            }
        });
        containerModal.appendChild(btnConfirm);
        containerModal.appendChild(btnCancel);
        let menuBackgroundModal = document.createElement("div");
        menuBackgroundModal.className = "menu-background-modal";
        menuBackgroundModal.addEventListener("click", () => {
            if (menuDeleteChat) {
                menuDeleteChat.remove();
            }
        });
        menuDeleteChat.appendChild(containerModal);
        menuDeleteChat.appendChild(menuBackgroundModal);
        document.body.appendChild(menuDeleteChat);
    }
    if (userName && display_name.length > 0) {
        userName.textContent = display_name;
    }
    else if (userName && name.length > 0) {
        userName.textContent = name;
    }
    chatGuestId = id;
    const message = {
        type: "online",
        request: true,
        senderId: id,
    };
    ws.send(JSON.stringify(message));
    setUsersId.forEach((ID) => {
        if (ID != id) {
            const messageSetUser = {
                type: "setUsers",
                senderId: userId,
                setUsers: [id],
            };
            ws.send(JSON.stringify(messageSetUser));
        }
    });
    const pictureChat = chatHeader?.querySelector(".picture-chat");
    pictureChat?.addEventListener("click", createUserInfo);
    async function createUserInfo() {
        if (document.querySelector(".menu-user-info")) {
            document.querySelector(".menu-user-info")?.remove();
        }
        let userNameRes = "";
        let userDisplayNameRes = "";
        let userBioRes = "";
        try {
            const response = await fetch("http://localhost:8080/user/profileInfo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ guestId: id }),
            });
            const jsonRes = await response.text();
            const responseBody = JSON.parse(jsonRes);
            if (response.ok) {
                if (response.status === 200) {
                    console.log(responseBody);
                    if (responseBody.name.length > 0) {
                        userNameRes = "name: " + responseBody.name;
                    }
                    if (responseBody.display_name &&
                        responseBody.display_name.length > 0) {
                        userDisplayNameRes = "displayed name: " + responseBody.display_name;
                    }
                    else if (responseBody.name.length > 0) {
                        userDisplayNameRes = "displayed name: " + responseBody.name;
                    }
                    if (responseBody.bio && responseBody.bio.length > 0) {
                        userBioRes = "bio: " + responseBody.bio;
                    }
                }
                else {
                    console.log(responseBody);
                }
            }
            else {
                console.log(responseBody);
            }
            const menuUserInfo = document.createElement("div");
            menuUserInfo.classList.add("menu-user-info", "d-flex");
            const containerModal = document.createElement("div");
            containerModal.classList.add("container-modal", "d-flex", "flex-column");
            const profilePicture = document.createElement("img");
            profilePicture.classList.add("menu-user-profile-picture");
            profilePicture.src = pictureChat?.getAttribute("src") ?? "";
            const userName = document.createElement("span");
            userName.classList.add("user-name");
            userName.textContent = userNameRes;
            const userDisplayName = document.createElement("span");
            userDisplayName.classList.add("user-display-name");
            userDisplayName.textContent = userDisplayNameRes;
            const userBio = document.createElement("span");
            userBio.classList.add("user-bio");
            userBio.textContent = userBioRes;
            containerModal.appendChild(profilePicture);
            containerModal.appendChild(userName);
            containerModal.appendChild(userDisplayName);
            containerModal.appendChild(userBio);
            const menuBackgroundModal = document.createElement("div");
            menuBackgroundModal.classList.add("menu-background-modal");
            menuBackgroundModal.addEventListener("click", () => {
                if (menuUserInfo) {
                    menuUserInfo.remove();
                }
            });
            menuUserInfo.appendChild(containerModal);
            menuUserInfo.appendChild(menuBackgroundModal);
            document.body.appendChild(menuUserInfo);
        }
        catch (error) {
            console.log(error);
        }
    }
    pictureChat?.setAttribute("src", pfpUrl);
    inputContainer?.classList.remove("d-none");
    chatHeader?.classList.remove("d-none");
    if (userId > 0)
        getChat(userId, id);
    form?.addEventListener("submit", (event) => {
        event.preventDefault();
        if (textareaBar &&
            userId > 0 &&
            chatId > 0 &&
            uploadFileInput instanceof HTMLInputElement) {
            sendMessage(userId, chatId, textareaBar, uploadFileInput, id);
            textareaBar.value = "";
        }
    });
}
function createMessageElements(i, responseBody, guestId) {
    const messageContainer = document.createElement("div");
    const messageDivContainer = document.createElement("div");
    messageDivContainer.classList.add("message-div-container");
    const chatUserPfpUrl = document
        .querySelector(".chat .chat-header .picture-chat")
        ?.getAttribute("src");
    const pfpContainerDiv = document.createElement("div");
    pfpContainerDiv.classList.add("message-pfp-container");
    const messageUpperContainer = document.createElement("div");
    messageUpperContainer.classList.add("messageUpperContainer");
    const messageLowerContainer = document.createElement("div");
    messageLowerContainer.classList.add("messageLowerContainer");
    const message = document.createElement("span");
    message.classList.add("span-message");
    messageUpperContainer.appendChild(message);
    if (responseBody[i].date_sent != null) {
        const spanDate = document.createElement("span");
        let date = new Date(responseBody[i].date_sent ?? "");
        spanDate.textContent = date.toLocaleString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
        messageLowerContainer.appendChild(spanDate);
    }
    if (responseBody[i].seen != null &&
        (responseBody[i].seen || !responseBody[i].seen)) {
        const seenSvg = document.createElement("img");
        messageLowerContainer.appendChild(seenSvg);
    }
    if (typeof responseBody[i].content === "string" &&
        (responseBody[i]?.content?.length ?? 0) > 0) {
        const span = document.createElement("span");
        span.classList.add("text-content");
        span.textContent = responseBody[i].content ?? "";
        message.appendChild(span);
    }
    if (responseBody[i].media) {
        const media = document.createElement("span");
        messageContainer.classList.add("media");
        if (responseBody[i]?.media?.type === "image") {
            const image = document.createElement("img");
            image.setAttribute("src", responseBody[i]?.media?.content ?? "");
            image.setAttribute("alt", "image s3");
            media.appendChild(image);
            message.prepend(media);
        }
    }
    else {
        messageContainer.classList.add("text");
    }
    const optionsMessage = document.createElement("span");
    optionsMessage.classList.add("options-message-btn");
    optionsMessage.addEventListener("click", () => {
        if (optionsMenu.classList.contains("d-none")) {
            optionsMenu.classList.remove("d-none");
            optionsMenu.classList.add("d-inline");
        }
        else {
            optionsMenu.classList.add("d-none");
            optionsMenu.classList.remove("d-inline");
        }
    });
    const arrowDownSvg = document.createElement("img");
    arrowDownSvg.setAttribute("src", "../img/icon-arrow-down.svg");
    arrowDownSvg.setAttribute("alt", "icon-arrow-down");
    optionsMessage.appendChild(arrowDownSvg);
    const optionsMenu = document.createElement("div");
    optionsMenu.setAttribute("id", "optionsMenu");
    optionsMenu.classList.add("d-none");
    optionsMessage.appendChild(optionsMenu);
    const deleteMessageOption = document.createElement("button");
    deleteMessageOption.textContent = "Delete message";
    optionsMenu.appendChild(deleteMessageOption);
    deleteMessageOption.addEventListener("click", (event) => {
        if (event.target instanceof HTMLButtonElement) {
            const messageId = Number(event.target.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.getAttribute("id"));
            if (messageId &&
                messageId > 0 &&
                event.target.parentElement?.parentElement?.parentElement?.parentElement
                    ?.parentElement instanceof HTMLDivElement) {
                deleteMessage(messageId, event.target.parentElement?.parentElement?.parentElement
                    ?.parentElement?.parentElement, guestId);
            }
        }
    });
    const editMessageOption = document.createElement("button");
    editMessageOption.textContent = "Edit message";
    optionsMenu.appendChild(editMessageOption);
    editMessageOption.addEventListener("click", (event) => {
        if (event.target instanceof HTMLButtonElement) {
            const messageId = Number(event.target.parentElement?.parentElement?.parentElement?.parentElement?.parentElement?.getAttribute("id"));
            if (messageId &&
                messageId > 0 &&
                event.target.parentElement?.parentElement?.parentElement?.parentElement
                    ?.parentElement instanceof HTMLDivElement) {
                editMessage(messageId, event.target.parentElement?.parentElement?.parentElement
                    ?.parentElement?.parentElement, guestId);
            }
        }
    });
    const editedSpanTextLabel = document.createElement("span");
    editedSpanTextLabel.textContent = "edited";
    editedSpanTextLabel.classList.add("edited-label-message");
    editedSpanTextLabel.classList.add("d-none");
    if (responseBody[i].edited) {
        editedSpanTextLabel.classList.remove("d-none");
        editedSpanTextLabel.classList.add("d-inline");
    }
    messageLowerContainer.prepend(editedSpanTextLabel);
    if (responseBody[i].id ?? 0 > 0) {
        messageContainer.setAttribute("id", (responseBody[i].id ?? 0).toString());
    }
    if (responseBody[i].seen) {
        messageContainer.classList.add("seen");
    }
    else {
        messageContainer.classList.add("sent");
    }
    if (responseBody[i].sender_id === userId) {
        messageContainer.classList.add("message-user");
        messageUpperContainer.appendChild(optionsMessage);
    }
    else {
        messageContainer.classList.add("message-other");
        if (responseBody[i].sender_id !== responseBody[i + 1]?.sender_id) {
            const lastDivMessage = document.querySelector(".chat .messages")?.firstElementChild;
            const chatUserImg = document.createElement("img");
            chatUserImg.classList.add("message-user-profile-picture");
            chatUserImg.setAttribute("src", chatUserPfpUrl ?? "");
            chatUserImg.setAttribute("alt", "profile picture");
            pfpContainerDiv.appendChild(chatUserImg);
            if (lastDivMessage?.classList.contains("message-other")) {
                lastDivMessage
                    ?.querySelector(".message-pfp-container .message-user-profile-picture")
                    ?.remove();
            }
        }
    }
    messageContainer.classList.add("message-container");
    messageDivContainer.appendChild(messageUpperContainer);
    messageDivContainer.appendChild(messageLowerContainer);
    messageContainer.appendChild(messageDivContainer);
    if (responseBody[i].sender_id === userId) {
        messageContainer.appendChild(pfpContainerDiv);
    }
    else {
        messageContainer.prepend(pfpContainerDiv);
    }
    messagesDiv?.prepend(messageContainer);
    scrollToBottom();
}
async function getChat(ownerId, guestId) {
    const usersId = {
        ownerId: ownerId,
        guestId: guestId,
    };
    try {
        const response = await fetch("http://localhost:8080/chats/get", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(usersId),
        });
        if (response.ok) {
            if (response.status == 200) {
                const responseBody = await response.json();
                const message = {
                    type: "seen",
                    senderId: guestId,
                    chatId: responseBody[0].chat_id,
                };
                ws.send(JSON.stringify(message));
                if (messagesDiv) {
                    messagesDiv.textContent = "";
                }
                //console.log(`body: ${responseBody[0].chat_id}`);
                //console.log(responseBody);
                if (responseBody[0].chat_id ?? 0 > 0) {
                    chatId = responseBody[0].chat_id ?? 0;
                }
                for (let i = 1; i < responseBody.length; i++) {
                    createMessageElements(i, responseBody, guestId);
                }
            }
        }
        else {
            const responseBody = await response.text();
            console.log(`body: ${responseBody}`);
        }
    }
    catch (error) {
        console.log(error);
    }
}
async function getPreviousChats() {
    if (userId > 0) {
        divLoader.appendChild(svg1);
        resultsUsersDiv?.appendChild(divLoader);
        try {
            const response = await fetch("http://localhost:8080/chats/getPrevious", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ownerId: userId }),
            });
            const responseBody = await response.text();
            if (response.ok) {
                if (response.status === 200) {
                    //console.log("Response body:", responseBody);
                    let users = JSON.parse(responseBody);
                    //console.log(users);
                    //console.log(response.status);
                    if (!(setUsersId.size > 0)) {
                        for (let i = 0; i < users.length; i++) {
                            if (users[i].id > 0) {
                                setUsersId.add(users[i].id);
                            }
                        }
                        if (setUsersId.size > 0) {
                            const message = {
                                type: "setUsers",
                                setUsers: Array.from(setUsersId),
                            };
                            ws.send(JSON.stringify(message));
                        }
                    }
                    createUsersElements(users, true);
                }
                else {
                    console.log(response);
                }
            }
            else {
                console.log(response);
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    if (resultsUsersDiv?.querySelector(".loading-container")) {
        resultsUsersDiv?.removeChild(divLoader);
    }
}
async function dynamicFetchMessages(messageDateSent, senderId, guestId) {
    try {
        if (chatId > 0) {
            const response = await fetch("http://localhost:8080/messages/getNew", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    chatId: chatId,
                    dateSent: messageDateSent,
                }),
            });
            if (response.ok) {
                if (response.status === 200) {
                    const responseBody = await response.json();
                    //console.log(responseBody);
                    const message = {
                        type: "seen",
                        senderId: senderId,
                        chatId: chatId,
                    };
                    ws.send(JSON.stringify(message));
                    for (let i = 0; i < responseBody.length; i++) {
                        createMessageElements(i, responseBody, guestId);
                    }
                }
            }
            else {
                console.log(await response.json());
            }
        }
    }
    catch (error) {
        console.log(error);
    }
}
async function sendMessage(senderId, chatId, userInput, fileInput, guestId) {
    if (chatId > 0 &&
        senderId > 0 &&
        ((userInput.value && userInput.value.length > 0) ||
            (fileInput.files && fileInput.files.length > 0))) {
        const formData = new FormData();
        formData.append("chatId", chatId.toString());
        formData.append("ownerId", userId.toString());
        if (userInput.value && userInput.value.length > 0) {
            formData.append("userInput", userInput.value);
        }
        if (fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.type.startsWith("image/")) {
                formData.append("image", file);
            }
            else if (file.type.startsWith("video/")) {
                formData.append("video", file);
            }
            else if (file.type.startsWith("audio/")) {
                formData.append("audio", file);
            }
        }
        try {
            const response = await fetch("http://localhost:8080/message/send", {
                method: "POST",
                body: formData,
            });
            const responseBody = await response.json();
            fileInput.value = "";
            if (response.ok) {
                if (response.status === 200) {
                    if (userId > 0 && chatId > 0 && responseBody.id > 0) {
                        const message = {
                            type: "message",
                            userId: userId,
                            chatId: chatId,
                            messageId: responseBody.id,
                        };
                        ws.send(JSON.stringify(message));
                    }
                    const messageRes = [responseBody];
                    createMessageElements(0, messageRes, guestId);
                }
                else {
                    console.log(responseBody);
                }
            }
            else {
                console.log(responseBody);
            }
        }
        catch (error) {
            console.log(error);
        }
    }
}
async function deleteMessage(messageId, divContainerMessage, senderId) {
    if (messageId > 0) {
        try {
            const response = await fetch("http://localhost:8080/message/delete", {
                method: "DELETE",
                headers: {
                    "Content-Type": "text/plain",
                },
                body: messageId.toString(),
            });
            const responseBody = await response.text();
            if (response.ok) {
                if (response.status === 200) {
                    const messageIdRes = Number(responseBody);
                    if (messageId === messageIdRes) {
                        divContainerMessage.remove();
                        const message = {
                            type: "delete",
                            senderId: senderId,
                            messageId: messageId,
                        };
                        ws.send(JSON.stringify(message));
                    }
                }
            }
            else {
                console.log(responseBody);
            }
        }
        catch (error) {
            console.log(error);
        }
    }
}
async function editMessage(messageId, divContainerMessage, senderId) {
    if (messageId > 0) {
        const messageSpan = divContainerMessage.querySelector(".messageUpperContainer .span-message");
        const messageTextSpan = divContainerMessage.querySelector(".messageUpperContainer .span-message .text-content");
        if (messageTextSpan) {
            const refMessageTextSpan = messageTextSpan;
            const textareaEditText = document.createElement("textarea");
            textareaEditText.classList.add("textarea-edit-message");
            const messageText = messageTextSpan?.textContent;
            if (typeof messageText === "string") {
                textareaEditText.value = messageText;
            }
            textareaEditText.style.width = `${refMessageTextSpan?.scrollWidth}px`;
            textareaEditText.style.height = `${refMessageTextSpan?.scrollHeight}px`;
            messageSpan?.appendChild(textareaEditText);
            messageTextSpan?.remove();
            textareaEditText.addEventListener("keyup", function (event) {
                if (event.target instanceof HTMLTextAreaElement) {
                    textareaEditText.style.height = "16px";
                    let scrollHeight = event.target.scrollHeight;
                    textareaEditText.style.height = `${scrollHeight}px`;
                }
            });
            textareaEditText.addEventListener("keydown", async (event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                    const editedText = textareaEditText.value;
                    if (editedText === messageText && messageTextSpan) {
                        messageSpan?.appendChild(messageTextSpan);
                        textareaEditText.remove();
                    }
                    else if (editedText.length > 0) {
                        try {
                            const response = await fetch("http://localhost:8080/message/edit", {
                                method: "PATCH",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    messageId: messageId.toString(),
                                    userInput: editedText,
                                }),
                            });
                            const responseBody = await response.text();
                            if (response.ok) {
                                //console.log(responseBody);
                                if (response.status === 200) {
                                    const message = {
                                        type: "editedMessage",
                                        content: editedText,
                                        senderId: senderId,
                                        messageId: messageId,
                                    };
                                    ws.send(JSON.stringify(message));
                                    if (refMessageTextSpan) {
                                        messageTextSpan.textContent = editedText;
                                        messageSpan?.appendChild(refMessageTextSpan);
                                        const textEditedLabel = divContainerMessage.querySelector(".edited-label-message");
                                        if (textEditedLabel) {
                                            textEditedLabel.classList.remove("d-none");
                                            textEditedLabel.classList.add("d-inline");
                                        }
                                        textareaEditText.remove();
                                    }
                                }
                            }
                            else {
                                console.log(responseBody);
                                if (messageTextSpan) {
                                    messageSpan?.appendChild(messageTextSpan);
                                }
                            }
                        }
                        catch (error) {
                            console.log(error);
                            if (messageTextSpan) {
                                messageSpan?.appendChild(messageTextSpan);
                            }
                        }
                    }
                }
            });
        }
    }
}
menuUserOptionsSignOut?.addEventListener("click", () => {
    localStorage.removeItem("session_key");
    window.location.href = "../pages/sign_in.html";
});
mainUserOptions?.addEventListener("click", () => {
    if (menuUserOptions?.classList.contains("d-none")) {
        menuUserOptions.classList.add("d-flex");
        menuUserOptions.classList.remove("d-none");
    }
    else {
        menuUserOptions?.classList.add("d-none");
        menuUserOptions?.classList.remove("d-flex");
    }
});
pfpImage?.addEventListener("click", () => {
    if (document.querySelector(".menu-profile")) {
        document.querySelector(".menu-profile")?.remove();
    }
    else {
        if (menuUserOptions?.classList.contains("d-flex")) {
            menuUserOptions?.classList.remove("d-flex");
            menuUserOptions?.classList.add("d-none");
        }
        if (chatUserOptionsContainer?.classList.contains("d-flex")) {
            chatUserOptionsContainer?.classList.remove("d-flex");
            chatUserOptionsContainer?.classList.add("d-none");
        }
        let menuProfile = document.createElement("div");
        menuProfile.className = "menu-profile d-flex";
        let containerModal = document.createElement("div");
        containerModal.className = "container-modal d-flex flex-column";
        let pfpUpload = document.createElement("input");
        pfpUpload.type = "file";
        pfpUpload.id = "pfp-upload";
        pfpUpload.accept = "image/*";
        pfpUpload.className = "d-none";
        pfpUpload?.addEventListener("change", function () {
            if (this instanceof HTMLInputElement &&
                this.files &&
                this.files.length > 0) {
                uploadPfpImage(this);
            }
        });
        let pfpLabel = document.createElement("label");
        pfpLabel.htmlFor = "pfp-upload";
        let pfpImg = document.createElement("img");
        pfpImg.className = "menu-profile-picture cursor-pointer";
        pfpImg.src =
            pfpImage.getAttribute("src") ??
                "../img/default-avatar-profile-icon-social.webp";
        pfpLabel.appendChild(pfpImg);
        let userInfoForm = document.createElement("form");
        userInfoForm.action = "/submit";
        userInfoForm.method = "post";
        userInfoForm.className =
            "edit-main-user-info-form d-flex flex-column w-100";
        let userName = document.createElement("textarea");
        userName.className = "main-user-name";
        userName.placeholder = "edit name";
        userName.value = mainUserNameTextContent;
        let userDisplayName = document.createElement("textarea");
        userDisplayName.className = "main-user-display-name";
        userDisplayName.placeholder = "edit display name";
        userDisplayName.value = mainUserDisplayNameTextContent;
        let userBio = document.createElement("textarea");
        userBio.className = "main-user-bio";
        userBio.placeholder = "edit bio";
        userBio.value = mainUserBioTextContent;
        let submitButton = document.createElement("input");
        submitButton.type = "submit";
        submitButton.value = "submit";
        userInfoForm?.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (((userName && userName.value.length > 0) ||
                (userBio && userBio.value.length > 0) ||
                (userDisplayName && userDisplayName.value.length > 0)) &&
                userId > 0) {
                try {
                    const userEditData = {
                        id: userId,
                        name: userName?.value ?? "",
                        display_name: userDisplayName?.value ?? "",
                        bio: userBio?.value ?? "",
                    };
                    const response = await fetch("http://localhost:8080/user/editProfile", {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(userEditData),
                    });
                    const resText = await response.text();
                    const responseBody = JSON.parse(resText);
                    if (response.ok) {
                        if (response.status === 200) {
                            //console.log(responseBody);
                            updateMainUserData(responseBody.name, { type: "none", content: "" }, responseBody.display_name, responseBody.bio);
                        }
                        else {
                            console.log(resText);
                        }
                    }
                    else {
                        console.log(resText);
                    }
                }
                catch (error) {
                    console.log(error);
                }
            }
        });
        userInfoForm.appendChild(userName);
        userInfoForm.appendChild(userDisplayName);
        userInfoForm.appendChild(userBio);
        userInfoForm.appendChild(submitButton);
        containerModal.appendChild(pfpUpload);
        containerModal.appendChild(pfpLabel);
        containerModal.appendChild(userInfoForm);
        let menuBackgroundModal = document.createElement("div");
        menuBackgroundModal.className = "menu-background-modal";
        menuProfile.appendChild(containerModal);
        menuProfile.appendChild(menuBackgroundModal);
        document.body.appendChild(menuProfile);
        menuBackgroundModal.addEventListener("click", () => {
            if (menuProfile) {
                menuProfile?.remove();
            }
        });
    }
    let optionsMenu = document.querySelectorAll("#optionsMenu");
    optionsMenu.forEach((div) => {
        div.classList.add("d-none");
        div.classList.remove("d-inline");
    });
});
chatUserOptions?.addEventListener("click", () => {
    if (chatUserOptionsContainer?.classList.contains("d-none")) {
        chatUserOptionsContainer?.classList.remove("d-none");
        chatUserOptionsContainer?.classList.add("d-flex");
    }
    else {
        chatUserOptionsContainer?.classList.add("d-none");
        chatUserOptionsContainer?.classList.remove("d-flex");
    }
});
deleteAccountBtn?.addEventListener("click", () => {
    if (document.querySelector(".menu-delete-user")) {
        document.querySelector(".menu-delete-user")?.remove();
    }
    if (menuUserOptions?.classList.contains("d-flex")) {
        menuUserOptions?.classList.remove("d-flex");
        menuUserOptions?.classList.add("d-none");
    }
    let menuDeleteUser = document.createElement("div");
    menuDeleteUser.className = "menu-delete-user d-flex";
    let containerModal = document.createElement("div");
    containerModal.className = "container-modal d-flex flex-column";
    let btnConfirm = document.createElement("button");
    btnConfirm.className = "btn-confirm";
    btnConfirm.textContent = "Delete user";
    btnConfirm.addEventListener("click", async () => {
        if (userId > 0) {
            try {
                const response = await fetch("http://localhost:8080/user/delete", {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "text/plain",
                    },
                    body: userId.toString(),
                });
                const responseBody = await response.text();
                if (response.ok) {
                    if (response.status === 200) {
                        //console.log(responseBody);
                        localStorage.removeItem("session_key");
                        window.location.href = "../index.html";
                    }
                    else {
                        console.log(responseBody);
                    }
                }
                else {
                    console.log(responseBody);
                }
            }
            catch (error) {
                console.log(error);
            }
        }
    });
    let btnCancel = document.createElement("button");
    btnCancel.className = "btn-cancel";
    btnCancel.textContent = "Cancel";
    btnCancel.addEventListener("click", () => {
        if (menuDeleteUser) {
            menuDeleteUser.remove();
        }
    });
    containerModal.appendChild(btnConfirm);
    containerModal.appendChild(btnCancel);
    let menuBackgroundModal = document.createElement("div");
    menuBackgroundModal.className = "menu-background-modal";
    menuBackgroundModal.addEventListener("click", () => {
        if (menuDeleteUser) {
            menuDeleteUser.remove();
        }
    });
    menuDeleteUser.appendChild(containerModal);
    menuDeleteUser.appendChild(menuBackgroundModal);
    document.body.appendChild(menuDeleteUser);
});
//# sourceMappingURL=main.js.map