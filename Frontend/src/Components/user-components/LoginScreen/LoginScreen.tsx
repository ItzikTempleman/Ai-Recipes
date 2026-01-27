import { useEffect, useState } from "react";
import "./LoginScreen.css";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";
import { Button, IconButton, InputAdornment, TextField } from "@mui/material";
import EmailIcon from '@mui/icons-material/Email';
import { ArrowBackIosNew, Visibility, VisibilityOff } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { Credentials } from "../../../Models/UserModel";
import { useTitle } from "../../../Utils/Utils";
import { notify } from "../../../Utils/Notify";
import { userService } from "../../../Services/UserService";
import { GoogleLogin } from "@react-oauth/google";
import { SetGoogleLoginPassword } from "../SetGoogleLoginPassword/SetGoogleLoginPassword";

export function LoginScreen() {
  useTitle("Login");
  const { t, i18n } = useTranslation();


  const isHebrew = (lng?: string) => (lng ?? "").startsWith("he");
  const [isRTL, setIsRTL] = useState(() => isHebrew(i18n.language));

  useEffect(() => {
    const onLangChange = (lng: string) => setIsRTL(isHebrew(lng));
    i18n.on("languageChanged", onLangChange);
    return () => {
      i18n.off("languageChanged", onLangChange);
    };
  }, [i18n]);

  function returnToLogin() {
    navigate("/home");
  }

  const [showPassword, setShowPassword] = useState(false);

  const [openSetPassword, setOpenSetPassword] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Credentials>({ mode: "onChange" })

  const navigate = useNavigate();

  async function send(credentials: Credentials) {
    try {
      await userService.loginOrRegister({ login: credentials })
      navigate("/home");
      reset()
    } catch (err) {
      notify.error(err)
    }
  }

  return (
    <div className="LoginScreen">
      <form className="LoginForm" onSubmit={handleSubmit(send)}>
        <ArrowBackIosNew className="BackIcon" onClick={returnToLogin} />

        <h2 className="LoginScreenTitle">{t("auth.login.title")}</h2>

        <TextField className="InputTextField"
          size="small"
          autoComplete="email" label={t("auth.login.emailLabel")} placeholder={t("auth.login.emailPlaceholder")} fullWidth
          InputProps={{
            ...(isRTL
              ? {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
              }
              : {
                endAdornment: (
                  <InputAdornment position="end">
                    <EmailIcon />
                  </InputAdornment>
                ),
              }),
          }}
          {
          ...register("email", {
            required: "Email is required", pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email"
            }
          }
          )
          }
          error={!!errors.email}
          helperText={errors.email?.message}
        ></TextField>

        <TextField className="InputTextField"
          autoComplete="password"
          label={t("auth.login.passwordLabel")}
          placeholder={t("auth.login.passwordPlaceholder")}
          fullWidth
          size="small"
          type={
            showPassword ? "text" : "password"
          }{
          ...register("password", {
            required: "Password is required",
            minLength: {
              value: 8, message: "At least 8 characters"
            }
          })
          }
          error={
            !!errors.password
          } helperText={
            errors.password?.message
          }
          InputProps={{
            ...(isRTL
              ? {
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton
                      edge="start"
                      tabIndex={-1}
                      onClick={() => setShowPassword((show) => !show)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }
              : {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      tabIndex={-1}
                      onClick={() => setShowPassword((show) => !show)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }),
          }}
        >
        </TextField>

        <Button type="submit"
          className="LoginScreenBtn"
          variant="contained">
          {t("auth.login.submit")}
        </Button>
        <NavLink to="/registration" className="RegisterLink">
          <p > {t("auth.login.registerLink")}</p>
        </NavLink>

        <div className="LoginWithFacebookAndGoogle">
          <div className="ResetGoogle">


            <GoogleLogin

              onSuccess={async (res) => {
                try {
                  if (!res.credential) throw new Error("Missing Google credential");
                  const user = await userService.loginWithGoogle(res.credential);
                  if (user?.needsPasswordSetup) {
                    setOpenSetPassword(true);
                  } else {
                    navigate("/home");
                  }
                } catch (err) {
                  notify.error(err);
                }
              }}
              onError={() => notify.error("Google login failed")}
              useOneTap={false}
            />

            <SetGoogleLoginPassword
              open={openSetPassword}
              onLater={() => {
                setOpenSetPassword(false);
                navigate("/home");
              }}
              onSubmit={async (password: string) => {
                try {
                  await userService.setLoggedInUserPassword(password);
                  setOpenSetPassword(false);
                  navigate("/home");
                } catch (err) {
                  notify.error(err);
                }
              }}
            />
          </div>

        </div>

        <NavLink to="/reset" className="ResetLink">
          <p > {t("auth.login.forgot")}</p>
        </NavLink>
      </form>
    </div>
  );
}