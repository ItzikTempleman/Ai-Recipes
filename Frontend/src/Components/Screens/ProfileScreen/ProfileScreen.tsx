// src/Components/Layout/ProfileArea/ProfileScreen.tsx

import { useSelector } from "react-redux";
import { getAge, showDate, useTitle } from "../../../Utils/Utils";
import "./ProfileScreen.css";
import { AppState } from "../../../Redux/Store";
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
  const gender =
    rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase();

  const [open, setOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit } = useForm<Partial<User>>({
    defaultValues: {
      firstName: user.firstName,
      familyName: user.familyName,
      email: user.email,
      phoneNumber: user.phoneNumber
    }
  });

  const fallbackAvatar = "person-21.png";

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  async function send(formUser: Partial<User>) {
    if (!user) return;

    // Use existing values when the form field is left unchanged
    const finalFirstName = formUser.firstName ?? user.firstName;
    const finalFamilyName = formUser.familyName ?? user.familyName;
    const finalEmail = formUser.email ?? user.email;
    const finalPhone = formUser.phoneNumber ?? user.phoneNumber;

    const formData = new FormData();
    // id comes from route param on backend, so we don't *need* it in body,
    // but it doesn't hurt:
    formData.append("id", String(user.id));
    formData.append("firstName", finalFirstName);
    formData.append("familyName", finalFamilyName);
    formData.append("email", finalEmail);
    formData.append("phoneNumber", finalPhone);

    if (selectedFile) {
      // VERY IMPORTANT: the field name "image" must match request.files.image on backend
      formData.append("image", selectedFile);
    }

    try {
      await userService.updateUserInfo(user.id, formData);
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
        {/* Edit button + dialog */}
        <div className="EditProfileDiv">
          <Button
            className="EditProfileBtn"
            variant="contained"
            onClick={handleClickOpen}
          >
            Edit
          </Button>
        </div>

        <Dialog open={open} onClose={handleClose} fullScreen={false}>
          <div className="DialogDiv">
            <div className="CloseDialogBtn" onClick={handleClose}>
              ❌
            </div>

            <form className="EditProfileContainer" onSubmit={handleSubmit(send)}>
              <TextField
                variant="outlined"
                size="small"
                label="Update first name"
                fullWidth
                inputProps={{ minLength: 2, maxLength: 30 }}
                placeholder="Update first name"
                {...register("firstName")}
              />

              <TextField
                variant="outlined"
                size="small"
                label="Update last name"
                fullWidth
                inputProps={{ minLength: 2, maxLength: 30 }}
                placeholder="Update last name"
                {...register("familyName")}
              />

              <TextField
                variant="outlined"
                size="small"
                label="Update email"
                fullWidth
                inputProps={{ minLength: 2, maxLength: 30 }}
                placeholder="Update email"
                {...register("email")}
              />

              <TextField
                variant="outlined"
                size="small"
                label="Update phone number"
                fullWidth
                inputProps={{ minLength: 2, maxLength: 30 }}
                placeholder="Update phone number"
                {...register("phoneNumber")}
              />

              <Button
                variant="contained"
                type="submit"
                fullWidth
                className="UpdateBtn"
              >
                Update profile
              </Button>
            </form>
          </div>
        </Dialog>

        {/* Avatar + file selector (outside dialog) */}
        <img
          className="ImagePreview"
          src={imagePreview || fallbackAvatar}
          alt="Profile"
        />

        <TextField
          variant="standard"
          InputProps={{ disableUnderline: true }}
          type="file"
          fullWidth
          inputProps={{ accept: "image/*" }}
          onChange={e => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
              setSelectedFile(file);
              setImagePreview(URL.createObjectURL(file));
            }
          }}
        />

        <h3 className="Name">
          {user.firstName} {user.familyName}
        </h3>
        <p>
          {age}, {gender}
        </p>
        <div className="divider" />
        <p>Email: {user.email}</p>
        <p>phone number: {user.phoneNumber}</p>
        <p>birth date: {birthDateStr}</p>
      </div>
    </div>
  );
}
