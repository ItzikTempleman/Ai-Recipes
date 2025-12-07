import { useSelector } from "react-redux";
import { getAge, showDate, useTitle } from "../../../Utils/Utils";
import "./ProfileScreen.css";
import { AppState } from "../../../Redux/Store";
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { Button, Dialog, IconButton, InputAdornment, TextField } from "@mui/material";
import { useState } from "react";
import { User } from "../../../Models/UserModel";
import { notify } from "../../../Utils/Notify";
import { userService } from "../../../Services/UserService";
import { useForm } from "react-hook-form";
import { Visibility, VisibilityOff } from "@mui/icons-material";
export function ProfileScreen() {

  const user = useSelector((state: AppState) => state.user);

  useTitle("Profile");
  if (!user) return null;
  const rawBirthDate = user.birthDate ?? "";           // "1997-07-09T00:00:00.000Z"
  const birthDateStr = showDate(rawBirthDate);         // "09/07/1997"
  // Use the ISO date part (YYYY-MM-DD) for age calculation:
  const isoDate = rawBirthDate.split("T")[0];          // "1997-07-09"
  const age = isoDate ? getAge(isoDate) : "";
  const rawGender = (user.gender ?? (user as any).Gender ?? "").toString();
  const gender = rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase();

  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<User>();

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  async function send(user: User) {
    try {
      await userService.updateUserInfo(user);
      notify.success("User has been updated");
      setOpen(false);
    } catch (err: unknown) {
      notify.error(err);
    }
  }

  return (
    <div className="ProfileScreen">
      <p className="ProfileScreenTitle">Profile</p>
      <div className="ProfileSection">
        <div className="EditProfileDiv">
          <Button className="EditProfileBtn"
            variant="contained"
            onClick={
              handleClickOpen
            }>Edit</Button>
        </div>
        <Dialog 
          open={open}
          onClose={handleClose}
          fullScreen={false}
          fullWidth
          PaperProps={{ className: "EditProfileDialogPaper" }}
        >

          <div className="CloseDialogBtn" onClick={handleClose}>❌</div>

          <form className="EditProfileContainer" onSubmit={handleSubmit(send)}>

            <TextField         variant="outlined"
              size="small"
              label="Update first name"
              fullWidth
              inputProps={{ minLength: 2, maxLength: 30 }}
              placeholder="Update first name"
              {
              ...register("firstName")
              } />

            <TextField 
              label="Update last name"
                      variant="outlined"
              size="small"
              fullWidth
              inputProps={{ minLength: 2, maxLength: 30 }}
              placeholder="Update last name"
              {
              ...register("familyName")
              } />

            <TextField 
                    variant="outlined"
              size="small"
              label="Update email"
              fullWidth
              inputProps={{ minLength: 2, maxLength: 30 }}
              placeholder="Update email"
              {
              ...register("email")
              } />

            <TextField         variant="outlined"
              size="small"
              autoComplete="update-password"
              label="Update password"
              placeholder="Update password"
              fullWidth
              type={showPassword ? "text" : "password"}
              {...register("password", {
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

            <Button variant="contained" fullWidth className="UpdateBtn">Update profile</Button>
          </form>
        </Dialog>

        <div className="Name"><PersonRoundedIcon /><h3>{user.firstName} {user.familyName}</h3></div>
        <p>{age}, {gender}</p>
        <div className="divider" />
        <p>Email: {user.email}</p>
        <p>phone number: {user.phoneNumber}</p>
        <p>birth date: {birthDateStr}</p>
      </div>
    </div>
  );
}