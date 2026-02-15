import { useEffect, useState } from "react";
import "./RegistrationScreen.css";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button, IconButton, InputAdornment, TextField } from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import { ArrowBackIosNew, Visibility, VisibilityOff,ArrowForwardIos } from "@mui/icons-material";
import EmailIcon from '@mui/icons-material/Email';
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import { useTranslation } from "react-i18next";
import { isAgeOk, useTitle } from "../../../Utils/Utils";
import { Gender, User } from "../../../Models/UserModel";
import { userService } from "../../../Services/UserService";
import { notify } from "../../../Utils/Notify";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import Collapse from "@mui/material/Collapse";

export function RegistrationScreen() {
  const { t, i18n } = useTranslation();
  const isHebrew = (lng?: string) => (lng ?? "").startsWith("he");
  const [isRTL, setIsRTL] = useState(() => isHebrew(i18n.language));

  const [showOptional, setShowOptional] = useState(false);
const toggleOptional = () => setShowOptional((s) => !s);

  useEffect(() => {
    const onLangChange = (lng: string) => setIsRTL(isHebrew(lng));
    i18n.on("languageChanged", onLangChange);
    return () => {
      i18n.off("languageChanged", onLangChange);
    };
  }, [i18n]);
const BackArrowIcon = isRTL ? ArrowForwardIos : ArrowBackIosNew;
  useTitle("Registration");
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<User>({
    mode: "onChange"
  })
  const navigate = useNavigate();
  async function send(user: User) {
    try {
      await userService.loginOrRegister({ register: user });
      navigate("/home");
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
    <div className="RegistrationScreen" dir={isRTL ? "rtl" : "ltr"}>
      <form className="RegistrationForm" onSubmit={handleSubmit(send)} autoComplete="off">
        <BackArrowIcon className="BackIcon" onClick={returnToLogin}/>
        <h2 className="RegistrationScreenTitle">  {t("auth.registration.title")}</h2>
        <div className={`NameRow ${isRTL ? "rtl" : "ltr"}`}>
          <TextField
            size="small"
            className="InputTextField NameTF"
           
            placeholder={t("auth.registration.firstNamePlaceholder")}
            {...register("firstName", {
              required: "First name is required",
              minLength: { value: 3, message: "Minimum 3 characters required" },
            })}
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
            InputProps={{
              ...(isRTL
                ? {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  )
                }:{
                  endAdornment: (
                    <InputAdornment position="end">
                      <PersonIcon />
                    </InputAdornment>
                  )
                })
            }}
          />

          <TextField
            size="small"
            className="InputTextField NameTF"
            
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
                  )
                } : {
                  endAdornment: (
                    <InputAdornment position="end">
                      <PersonIcon />
                    </InputAdornment>
                  )
                })
            }}
          />
        </div>
        <TextField className="InputTextField"
        
          
          placeholder={t("auth.registration.emailPlaceholder")}
          fullWidth
            size="small"
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
                )
              } : {
                endAdornment: (
                  <InputAdornment position="end">
                    <EmailIcon />
                  </InputAdornment>
                )
              })
          }}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <TextField className="InputTextField"
          size="small"
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
                )
              }:{
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
                )
              })
          }}
        />
<div className="Divider--clickable" onClick={toggleOptional} 
     onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleOptional()}>


  <div className="DividerTitle">
    <h4>{t("auth.registration.optionalFields")}</h4>

    <IconButton
      className="DividerToggle"
      onClick={(e) => {
        e.stopPropagation(); 
        toggleOptional();
      }}>
      {showOptional ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
    </IconButton>
  </div>


</div>

<Collapse in={showOptional} timeout={250} unmountOnExit>
  <div className="OptionalFields">
    <TextField className="InputTextField"
      placeholder={t("auth.registration.phonePlaceholder")}
      fullWidth
        size="small"
      type="tel"
      variant="outlined"
      InputProps={{
        ...(isRTL
          ? {
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneAndroidIcon />
                </InputAdornment>
              )
            }
          : {
              endAdornment: (
                <InputAdornment position="end">
                  <PhoneAndroidIcon />
                </InputAdornment>
              )
            })
      }}
      inputProps={{
        inputMode: "tel",
        pattern: "[0-9]*",
      }}
      {...register("phoneNumber")}
      error={!!errors.phoneNumber}
      helperText={errors.phoneNumber?.message}
    />

    <TextField className="InputTextField"
      fullWidth
        size="small"
      type="date"
      {...register("birthDate", {
        validate: (value) => {
          if (!value) return true;
          const today = new Date();
          const chosen = new Date(value);
          if (Number.isNaN(chosen.getTime())) return true;
          if (chosen > today) return `${t("auth.registration.birthDateFuture")}`;
          if (!isAgeOk(chosen)) return `${t("auth.registration.minAge12")}`;
          return true;
        }
      })}
      placeholder={t("auth.registration.birthDateLabel")}
      InputLabelProps={{ shrink: true }}
      error={!!errors.birthDate}
      helperText={errors.birthDate?.message}
    />

    <FormControl className="FormController">
      <Controller
        name="gender"
        control={control}
        render={({ field }) => (
          <RadioGroup row {...field}>
            <FormControlLabel value={Gender.MALE} control={<Radio />} label={t("auth.registration.male")} />
            <FormControlLabel value={Gender.FEMALE} control={<Radio />} label={t("auth.registration.female")} />
            <FormControlLabel value={Gender.OTHER} control={<Radio />} label={t("auth.registration.other")} />
          </RadioGroup>
        )}
      />
    </FormControl>
  </div>
</Collapse>

        <Button
          type="submit"
          className="RegistrationScreenBtn"
          variant="contained">
          {t("auth.registration.submit")}
        </Button>
      </form>
    </div>
  );
}

