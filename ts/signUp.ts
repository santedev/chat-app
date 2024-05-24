type NewUser = {
  name: string;
  email: string;
  password: string;
};

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("class", "loader");

const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
circle.setAttribute("cx", "30");
circle.setAttribute("cy", "30");
circle.setAttribute("r", "30");

let inputWarningMessage = document.querySelector("#user-input-message-text");
const formSignUp = document.querySelector("#sign-up-form");

formSignUp?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const userNameInput =
    formSignUp.querySelector<HTMLInputElement>('input[name="name"]');
  const userEmailInput = formSignUp.querySelector<HTMLInputElement>(
    'input[name="email"]'
  );
  const userPasswordInput = formSignUp.querySelector<HTMLInputElement>(
    'input[name="password"]'
  );
  const userPasswordConfirmInput = formSignUp.querySelector<HTMLInputElement>(
    'input[name="confirmPassword"]'
  );
  const userPfp = document.querySelector<HTMLInputElement>("#file-upload");

  const userName = userNameInput?.value;
  const userEmail = userEmailInput?.value;
  const userPassword = userPasswordInput?.value;
  const userPasswordConfirm = userPasswordConfirmInput?.value;

  function addInputWarningMessage(text: string) {
    if (inputWarningMessage) {
      inputWarningMessage.classList.add("alert");
      inputWarningMessage.classList.remove("success");
      inputWarningMessage.textContent = text;
    }
  }

  function checkUserName(name: string) {
    const checkedName = /^\w{2,16}$/i.test(name);
    if (!checkedName) {
      if (name.length < 2 || name.length > 16) {
        addInputWarningMessage("Name is not between 2 to 16 characters");
      } else {
        addInputWarningMessage(
          'Name either uses empty spaces or special characters that aren\'t underscore "_"'
        );
      }
    }
    return checkedName;
  }
  function checkUserEmail(email: string) {
    const [localPart, domainPart] = email.split("@");
    const localPartRegex = /^[a-zA-Z0-9]+(?:[._][a-zA-Z0-9]+)*$/;
    const domainRegex = /^(gmail|outlook|hotmail|email)\.com$/i;
    if (
      /^[._]$/.test(localPart[0]) ||
      /^[._]$/.test(localPart[localPart.length - 1])
    ) {
      addInputWarningMessage(
        "First part of the email can't start or end with dot or underscore"
      );
    } else if (localPart.length < 6 || localPart.length > 30) {
      addInputWarningMessage(
        "First part of the email is not between 6 to 30 characters"
      );
    } else if (!domainRegex.test(domainPart)) {
      addInputWarningMessage(
        'Email must have either gmail, outlook, hotmail, email and end with ".com"'
      );
    } else if (!localPartRegex.test(localPart)) {
      addInputWarningMessage(
        "Email cant contain special characters that aren't non-consecutive dots or underscores"
      );
    }
    return (
      localPartRegex.test(localPart) &&
      localPart.length >= 6 &&
      localPart.length <= 30 &&
      domainRegex.test(domainPart)
    );
  }
  function checkUserPassword(password: string, confirmedPassword: string) {
    const checkedPassword =
      password.length >= 8 && password.length <= 20 && /^\S+$/.test(password);
    if (!checkedPassword) {
      addInputWarningMessage(
        "Password must be between 8 and 20 characters and must not contain empty spaces"
      );
    } else if (password !== confirmedPassword) {
      addInputWarningMessage(
        "Password and confirmed password are not the same one"
      );
    }
    return checkedPassword && password === confirmedPassword;
  }

  if (
    userName &&
    userEmail &&
    userPassword &&
    userPasswordConfirm &&
    checkUserName(userName) &&
    checkUserEmail(userEmail) &&
    checkUserPassword(userPassword, userPasswordConfirm)
  ) {
    if (inputWarningMessage) {
      inputWarningMessage.classList.remove("alert");
      inputWarningMessage.textContent = "Correct format for new user";
      inputWarningMessage.classList.add("success");
    }
    const userInfo: NewUser = {
      name: userName,
      email: userEmail,
      password: userPassword,
    };
    let loadingContainer = document.querySelector(".loading-container");
    try {
      
      loadingContainer?.appendChild(svg);
      const response = await fetch("https://restfulapi-chatapp.onrender.com/user/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userInfo),
      });

      const resText = await response.text();
      const responseBody = JSON.parse(resText);
      if (response.ok) {
        console.log("Response body:", responseBody);
        console.log(response.status);
        let userIdRes = -1;
        if (Number(responseBody.id) > 0) {
          userIdRes = Number(responseBody.id);
        }
        if (response.status == 200) {
          if (inputWarningMessage) {
            inputWarningMessage.classList.remove("alert");
            inputWarningMessage.textContent = "User created successfully";
            inputWarningMessage.classList.add("success");
            if (
              userPfp instanceof HTMLInputElement &&
              userPfp.files &&
              userPfp.files.length > 0
            ) {
              if(!loadingContainer?.querySelector(".loader")){
                loadingContainer?.appendChild(svg);
              }
              await uploadPfp(userPfp);
              loadingContainer?.removeChild(svg);
            }
            async function uploadPfp(fileInput: HTMLInputElement) {
              if (fileInput.files && fileInput) {
                try {
                  console.log(fileInput.files[0]);
                  const formData = new FormData();
                  formData.append("image", fileInput.files[0]);
                  formData.append("id", userIdRes.toString());
                  const response = await fetch(
                    "https://restfulapi-chatapp.onrender.com/user/newPfp",
                    {
                      method: "POST",
                      body: formData,
                    }
                  );
                  if (response.ok) {
                    //console.log(await response.text());
                  } else {
                    console.log(await response.text());
                  }
                } catch (error) {
                  console.log(error);
                }
              }
            }
          }
          localStorage.setItem("session_key", responseBody.session_key);
          window.location.href = "../user+pages/chats.html";
        }
      } else {
        console.log("Response body:", responseBody);
        console.log(response.status);
        if (response.status == 400) {
          if (inputWarningMessage) {
            inputWarningMessage.classList.add("alert");
            inputWarningMessage.textContent = "This email is already in use";
            inputWarningMessage.classList.remove("success");
          }
        }
      }
    } catch (error) {
      console.log("Error creating user:", error);
      if (inputWarningMessage) {
        inputWarningMessage.classList.add("alert");
        inputWarningMessage.textContent =
          "Something went wrong, check your internet connection";
        inputWarningMessage.classList.remove("success");
      }
    }
    //console.log(userInfo);
    loadingContainer?.removeChild(svg);
  }
});
