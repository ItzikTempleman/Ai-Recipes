import { useState } from "react";
import { useTitle } from "../../../../Utils/Utils";
import "./RegistrationScreen.css";
import { Gender, User } from "../../../../Models/UserModel";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { userService } from "../../../../Services/UserService";
import { notify } from "../../../../Utils/Notify";
import { Button, IconButton, InputAdornment, TextField } from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import { Visibility, VisibilityOff } from "@mui/icons-material";
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';

export function RegistrationScreen() {
  useTitle("Registration");
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<User>({
    mode: "onChange", defaultValues: {
      gender: Gender.MALE,
    }
  })
  const navigate = useNavigate();
  async function send(user: User) {
    try {
      await userService.loginOrRegister({ register: user });
      navigate("/home-screen");
      reset();
    } catch (err) {
      console.error("Registration failed", err);
      notify.error(err);
    }
  }

  function returnToLogin() {
    navigate("/login-screen");
  }

  return (
    <div className="RegistrationScreen">
      <form className="RegistrationForm" onSubmit={handleSubmit(send)}>
        <Button className="BackBtn" variant="contained" onClick={returnToLogin}>
          <ArrowBackIosIcon />
          Back
        </Button>
        <h2 className="RegistrationScreenTitle">Registration</h2>
        <TextField
          label="Enter first name"
          placeholder="first name"
          {...register("firstName", {
            required: "First name is required",
            minLength: { value: 3, message: "Minimum 3 characters required" }
          })}
          error={!!errors.firstName}
          helperText={errors.firstName?.message}
          InputProps={
            {
              endAdornment: (
                <InputAdornment position="end">
                  <PersonIcon />
                </InputAdornment>
              )
            }}
        />
        <TextField
          label="Enter family name"
          placeholder="family name"
          {...register("familyName", {
            required: "Family name is required",
            minLength: { value: 3, message: "Minimum 3 characters required" }
          })}
          error={!!errors.familyName}
          helperText={errors.familyName?.message}
          InputProps={
            {
              endAdornment: (
                <InputAdornment position="end">
                  <PersonIcon />
                </InputAdornment>
              )
            }}
        />
        <TextField
          autoComplete="email"
          label="Enter email"
          placeholder="Email"
          fullWidth
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email"
            }
          })}
          InputProps={
            {
              endAdornment: (
                <InputAdornment position="end">
                  <EmailIcon />
                </InputAdornment>
              )
            }}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <TextField
          autoComplete="current-password"
          label="Enter password"
          placeholder="Password"
          fullWidth
          type={showPassword ? "text" : "password"}
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "At least 8 characters" }
          })}
          error={!!errors.password}
          helperText={errors.password?.message}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  tabIndex={-1}
                  onClick={() => setShowPassword((password) => !password)}
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <TextField
          fullWidth
          type="date"
          {...register("birthDate", {
            required: "Birth date is required",
            validate: (value) => {
              const today = new Date();
              const chosen = new Date(value);
              if (chosen > today) return "Birth date cannot be in the future";
              return true;
            }
          })}
          error={!!errors.birthDate}
          helperText={errors.birthDate?.message}
        />
        <TextField
          label="Enter phone number"
          placeholder="Phone number"
          fullWidth
          type="tel"
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <PhoneAndroidIcon />
              </InputAdornment>
            ),
          }}
          inputProps={{
            inputMode: "tel",
            pattern: "[0-9]*",
          }}
          {...register("phoneNumber", {
            required: "Phone number is required",
          })}
          error={!!errors.phoneNumber}
          helperText={errors.phoneNumber?.message}
        />
        <FormControl>
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <RadioGroup row {...field}>
                <FormControlLabel
                  value={Gender.MALE}
                  control={<Radio />}
                  label="Male"
                />
                <FormControlLabel
                  value={Gender.FEMALE}
                  control={<Radio />}
                  label="Female"
                />
                <FormControlLabel
                  value={Gender.OTHER}
                  control={<Radio />}
                  label="Other"
                />
              </RadioGroup>
            )}
          />
        </FormControl>
        <Button
          type="submit"
          className="RegistrationBtn"
          variant="contained">
          Register
        </Button>
      </form>
    </div>
  );
}

