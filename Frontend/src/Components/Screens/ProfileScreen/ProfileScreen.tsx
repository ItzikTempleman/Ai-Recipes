import { useSelector } from "react-redux";
import { getAge, showDate, useTitle } from "../../../Utils/Utils";
import "./ProfileScreen.css";
import { AppState } from "../../../Redux/Store";
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { Button, Dialog, TextField } from "@mui/material";
import { useState } from "react";
import { User } from "../../../Models/UserModel";
import { notify } from "../../../Utils/Notify";
import { userService } from "../../../Services/UserService";
import { useForm } from "react-hook-form";

export function ProfileScreen() {
  const user = useSelector((state: AppState) => state.user);
  useTitle("Profile");
  if (!user) return null;
  const rawBirthDate = user.birthDate ?? "";
  const birthDateStr = showDate(rawBirthDate);
  const isoDate = rawBirthDate.split("T")[0];
  const age = isoDate ? getAge(isoDate) : "";
  const rawGender = (user.gender ?? (user as any).Gender ?? "").toString();
  const gender = rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit } = useForm<User>({
    defaultValues: {
      firstName: user.firstName,
      familyName: user.familyName,
      email: user.email,
      phoneNumber: user.phoneNumber
    }
  });

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  async function send(formUser: User) {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      ...formUser
    };
    try {
      await userService.updateUserInfo(updatedUser);
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
          fullScreen={false}>
            <div className="DialogDiv">
          <div className="CloseDialogBtn" onClick={handleClose}>❌</div>
          <form className="EditProfileContainer" onSubmit={handleSubmit(send)}>
            <TextField variant="outlined"
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
            <TextField
              variant="outlined"
              size="small"
              label="Update phone number"
              fullWidth
              inputProps={{ minLength: 2, maxLength: 30 }}
              placeholder="Update phone number"
              {
              ...register("phoneNumber")
              } />
            <Button variant="contained" type="submit" fullWidth className="UpdateBtn">Update profile</Button>
          </form>
            </div>
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