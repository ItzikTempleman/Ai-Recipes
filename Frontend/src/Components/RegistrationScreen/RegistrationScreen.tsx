import { useEffect, useState } from "react";
import "./RegistrationScreen.css";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button, IconButton, InputAdornment, TextField } from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import { Visibility, VisibilityOff } from "@mui/icons-material";
import EmailIcon from '@mui/icons-material/Email';
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import { useTranslation } from "react-i18next";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { isAgeOk, useTitle } from "../../Utils/Utils";
import { Gender, User } from "../../Models/UserModel";
import { userService } from "../../Services/UserService";
import { notify } from "../../Utils/Notify";

export function RegistrationScreen() {
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
  
  const ArrowIcon = isRTL ? ArrowForwardIosIcon : ArrowBackIosNewIcon;

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
      navigate("/generate");
      reset();
    } catch (err) {
      console.error("Registration failed", err);
      notify.error(err);
    }
  }
  function returnToLogin() {
    navigate("/login");
  }
  return (
    <div className="RegistrationScreen">
      <form className="RegistrationForm" onSubmit={handleSubmit(send)}>
        <Button className="BackBtn" variant="contained" onClick={returnToLogin}>
          <ArrowIcon />
          {t("auth.registration.back")}
        </Button>
        <h2 className="RegistrationScreenTitle">  {t("auth.registration.title")}</h2>
        <div className="NameRow">

          <TextField
            className="InputTextField NameTF"
            label={t("auth.registration.firstNameLabel")}
            placeholder={t("auth.registration.firstNamePlaceholder")}
            {...register("firstName", {
              required: "First name is required",
              minLength: { value: 3, message: "Minimum 3 characters required" },
            })}
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
          />

          <TextField
            className="InputTextField NameTF"
            label={t("auth.registration.lastNameLabel")}
            placeholder={t("auth.registration.lastNamePlaceholder")}
            {...register("familyName", {
              required: "Last name is required",
              minLength: { value: 3, message: "Minimum 3 characters required" },
            })}
            error={!!errors.familyName}
            helperText={errors.familyName?.message}
            InputProps={{
              ...(isRTL
                ? {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }
                : {
                  endAdornment: (
                    <InputAdornment position="end">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }),
            }}
          />
        </div>
        <TextField className="InputTextField"
          autoComplete="email"
          label={t("auth.registration.emailLabel")}
          placeholder={t("auth.registration.emailPlaceholder")}
          fullWidth
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email"
            }
          })}
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
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <TextField className="InputTextField"
          autoComplete="current-password"
          label={t("auth.registration.passwordLabel")}
          placeholder={t("auth.registration.passwordPlaceholder")}
          fullWidth
          type={showPassword ? "text" : "password"}
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "At least 8 characters" }
          })}
          error={!!errors.password}
          helperText={errors.password?.message}
          InputProps={{
            ...(isRTL
              ? {
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton
                      edge="start"
                      tabIndex={-1}
                      onClick={() => setShowPassword((p) => !p)}
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
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }),
          }}
        />
        <TextField className="InputTextField"
          fullWidth
          type="date"
          {...register("birthDate", {
            required: `${t("auth.registration.birthDateRequired")}`,
            validate: (value) => {
              const today = new Date();
              const chosen = new Date(value);
              const isAgeValid = isAgeOk(chosen)
              if (chosen > today) return `${t("auth.registration.birthDateFuture")}`;
              if (!isAgeValid) return `${t("auth.registration.minAge12")}`;
              return true;
            }
          })}
          label={t("auth.registration.birthDateLabel")}
          InputLabelProps={{ shrink: true }}
          error={!!errors.birthDate}
          helperText={errors.birthDate?.message}
        />
        <TextField className="InputTextField"
          label={t("auth.registration.phoneLabel")}
          placeholder={t("auth.registration.phonePlaceholder")}
          fullWidth
          type="tel"
          variant="outlined"
          InputProps={{
            ...(isRTL
              ? {
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneAndroidIcon />
                  </InputAdornment>
                ),
              }
              : {
                endAdornment: (
                  <InputAdornment position="end">
                    <PhoneAndroidIcon />
                  </InputAdornment>
                ),
              }),
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
        <FormControl className="FromController">
          <Controller
            name="gender"
            control={control}
            render={({ field }) => (
              <RadioGroup row {...field}>
                <FormControlLabel
                  value={Gender.MALE}
                  control={<Radio />}
                  label={t("auth.registration.male")}
                />
                <FormControlLabel
                  value={Gender.FEMALE}
                  control={<Radio />}
                  label={t("auth.registration.female")}
                />
                <FormControlLabel
                  value={Gender.OTHER}
                  control={<Radio />}
                  label={t("auth.registration.other")}
                />
              </RadioGroup>
            )}
          />
        </FormControl>
        <Button
          type="submit"
          className="RegistrationBtn"
          variant="contained">
          {t("auth.registration.submit")}
        </Button>
      </form>
    </div>
  );
}

