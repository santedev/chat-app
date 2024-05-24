const formSignIn = document.querySelector("#sign-in-form");

formSignIn?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const userAccountInput = formSignIn.querySelector<HTMLInputElement>(
    'input[name="name/email"]'
  );
  const userPasswordInput = formSignIn.querySelector<HTMLInputElement>(
    'input[name="password"]'
  );
  const userAccount = userAccountInput?.value;
  let userName;
  let userEmail;
  const userPassword = userPasswordInput?.value;
  function checkUserName(name: string) {
    return /^\w{2,16}$/i.test(name);
  }
  function checkUserEmail(email: string) {
    const [localPart, domainPart] = email.split("@");
    const localPartRegex = /^[a-zA-Z0-9]+(?:[._][a-zA-Z0-9]+)*$/;
    const domainRegex = /^(gmail|outlook|hotmail|email)\.com$/i;
    return (
      localPartRegex.test(localPart) &&
      localPart.length >= 6 &&
      localPart.length <= 30 &&
      domainRegex.test(domainPart)
    );
  }
  let userEmailBoolean;
  let userNameBoolean;
  if (userAccount) {
    userEmailBoolean = checkUserEmail(userAccount);
    userNameBoolean = checkUserName(userAccount);
  }
  if (userPassword && userAccount && (userEmailBoolean || userNameBoolean)) {
    let user;
    if (userEmailBoolean) {
      userEmail = userAccount;
      user = {
        email: userEmail,
        password: userPassword,
      };
    } else if (userNameBoolean) {
      userName = userAccount;
      user = {
        name: userName,
        password: userPassword,
      };
    }

    try {
      const response = await fetch("https://restfulapi-chatapp.onrender.com/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      const responseBody = await response.text();
      if (response.ok) {
        console.log("Response body:", responseBody);
        console.log(response.status);
        if (response.status == 200) {
          let textAlertMessage = document.querySelector("#res-text");
          if (textAlertMessage) {
            textAlertMessage.classList.remove("alert");
            textAlertMessage.classList.add("success");
            textAlertMessage.textContent = "correct user";
          }
          localStorage.setItem("session_key", responseBody);
          window.location.href = "../user+pages/chats.html";
        } else {
          console.log("Response body:", responseBody);
        }
      } else {
        console.log("Response body:", responseBody);
        if (response.status == 400) {
          let textAlertMessage = document.querySelector("#res-text");
          if (textAlertMessage) {
            textAlertMessage.classList.add("alert");
            textAlertMessage.classList.remove("success");
            textAlertMessage.textContent = "password or email is not correct";
          }
          console.log("Incorrect password");
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
});
