import { useState } from "react";
import { useTitle } from "../../../../Utils/Utils";
import "./LoginScreen.css";
import { Credentials } from "../../../../Models/UserModel";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";
import { userService } from "../../../../Services/UserService";
import { notify } from "../../../../Utils/Notify";
import { Button, IconButton, InputAdornment, TextField } from "@mui/material";
import EmailIcon from '@mui/icons-material/Email';
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

export function LoginScreen() {
  useTitle("Login");
    const { t } = useTranslation();

    const isRTL = document.documentElement.dir === "rtl";
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Credentials>({ mode: "onChange" })

  const navigate = useNavigate();

  async function send(credentials: Credentials) {
    try {
      await userService.loginOrRegister({ login: credentials })
      navigate("/generate");
      reset()
    } catch (err) {
      notify.error(err)
    }
  }

  return (
    <div className="LoginScreen">
      <form className="LoginForm" onSubmit={handleSubmit(send)}>
        <h2 className="LoginScreenTitle">{t("auth.login.title")}</h2>

        <TextField className="InputTextField"
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
          className="LoginButton"
          variant="contained">
          {t("auth.login.submit")}
        </Button>

 
  
          <NavLink to="/registration" className="RegisterLink">
            <h2> {t("auth.login.registerLink")}</h2>
          </NavLink>
   
      </form>
    </div>
  );
}