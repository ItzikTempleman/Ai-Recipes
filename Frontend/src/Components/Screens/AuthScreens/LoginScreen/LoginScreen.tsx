import { useState } from "react";
import { useTitle } from "../../../../Utils/Utils";
import "./LoginScreen.css";
import { CredentialsModel } from "../../../../Models/UserModel";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";
import { userService } from "../../../../Services/UserService";
import { notify } from "../../../../Utils/Notify";
import { Button, IconButton, InputAdornment, TextField } from "@mui/material";
import EmailIcon from '@mui/icons-material/Email';
import { Visibility, VisibilityOff } from "@mui/icons-material";

export function LoginScreen() {
  useTitle("Login");

  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CredentialsModel>({ mode: "onChange" })

  const navigate = useNavigate();

  async function send(credentials: CredentialsModel) {
    try {
      await userService.loginOrRegister({ login: credentials })
      navigate("/home-screen");
      reset()
    } catch (err) {
      notify.error(err)
    }
  }

  return (
    <div className="LoginScreen">
      <form className="LoginForm" onSubmit={handleSubmit(send)}>
        <h2 className="LoginScreenTitle">Log in</h2>

        <TextField
          autoComplete="email" label="Enter Email" placeholder="Email" fullWidth
          InputProps={
            {
              endAdornment: (
                <InputAdornment position="end">
                  <EmailIcon />
                </InputAdornment>
              )
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

        <TextField
          autoComplete="password"
          label="Enter password"
          placeholder="Password"
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
          InputProps={
            {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end" tabIndex={-1} onClick={() => setShowPassword((show) => !show)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >  {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }
          }
        >
        </TextField>

        <Button type="submit"
          className="LoginButton"
          variant="contained">
          Log in
        </Button>

 
  
          <NavLink to="/registration-screen" className="RegisterLink">
            <h2>Register</h2>
          </NavLink>
   
      </form>
    </div>
  );
}