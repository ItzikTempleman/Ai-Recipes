import { useSelector } from "react-redux";
import "./ProfileScreen.css";
import { Button, Dialog, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppState } from "../../../Redux/Store";
import { getAge, showDate, useTitle } from "../../../Utils/Utils";
import { User } from "../../../Models/UserModel";
import { userService } from "../../../Services/UserService";
import { notify } from "../../../Utils/Notify";
import { useNavigate } from "react-router-dom";
import CloseIcon from '@mui/icons-material/Close';

export function ProfileScreen() {
  const user = useSelector((state: AppState) => state.user);
  useTitle("Profile");
  if (!user) return null;

  const { t } = useTranslation();

  const navigate = useNavigate()
  const rawBirthDate = user.birthDate ?? "";
  const birthDateStr = rawBirthDate ? showDate(rawBirthDate) : "";
  const isoDate = rawBirthDate ? rawBirthDate.split("T")[0] : "";
  const computedAge = isoDate ? getAge(isoDate) : NaN;
  const ageText = Number.isFinite(computedAge) ? String(computedAge) : "";

  const rawGender = (user.gender ?? (user as any).Gender ?? "")?.toString() ?? "";
  const genderText = rawGender
    ? rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase()
    : "";

  const [open, setOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    user.imageUrl ?? null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit } = useForm<Partial<User>>({
    defaultValues: {
      firstName: user.firstName,
      familyName: user.familyName,
      email: user.email,
      phoneNumber: user.phoneNumber ?? ""
    }
  });

  const fallbackAvatar = "/person-21.png";
  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  useEffect(() => {
    if (user?.imageUrl) {
      setImagePreview(user.imageUrl);
    }
  }, [user?.imageUrl]);

  async function send(formUser: Partial<User>) {
    const finalFirstName = formUser.firstName ?? user.firstName;
    const finalFamilyName = formUser.familyName ?? user.familyName;
    const finalEmail = formUser.email ?? user.email;
    const finalPhone = (formUser.phoneNumber ?? user.phoneNumber ?? "").toString();

    const formData = new FormData();
    formData.append("id", String(user.id));
    formData.append("firstName", finalFirstName);
    formData.append("familyName", finalFamilyName);
    formData.append("email", finalEmail);
    formData.append("phoneNumber", finalPhone);

    if (selectedFile) {
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
      <p className="ProfileScreenTitle">{t("profile.title")}</p>

 <div className="ProfileSection">

<div className="EditAndCloseSection">
   <Button className="EditProfileBtn"onClick={handleClickOpen} > {t("profile.edit")}</Button>
        <div className="ReturnBtn" onClick={() => navigate("/home")}>   <CloseIcon/> </div>
</div>


        <Dialog open={open} onClose={handleClose} fullScreen={false}>
          <div className="DialogDiv">
            <div className="CloseDialogBtn" onClick={handleClose}>
            <CloseIcon/>
            </div>

            <form className="EditProfileContainer" onSubmit={handleSubmit(send)}>
              <TextField
                variant="outlined"
                size="small"
                label={t("profile.updateFirstName")}
                fullWidth
                inputProps={{ minLength: 2, maxLength: 30 }}
                placeholder={t("profile.updateFirstName")}
                {...register("firstName")}
              />

              <TextField
                variant="outlined"
                size="small"
                label={t("profile.updateLastName")}
                fullWidth
                inputProps={{ minLength: 2, maxLength: 30 }}
                placeholder={t("profile.updateLastName")}
                {...register("familyName")}
              />

              <TextField
                variant="outlined"
                size="small"
                label={t("profile.updateEmail")}
                fullWidth
                inputProps={{ minLength: 2, maxLength: 30 }}
                placeholder={t("profile.updateEmail")}
                {...register("email")}
              />

              <TextField
                variant="outlined"
                size="small"
                label={
                  user.phoneNumber && user.phoneNumber.trim() !== ""
                    ? t("profile.updatePhone")
                    : t("profile.addPhoneNumber")
                }
                fullWidth
                inputProps={{ minLength: 2, maxLength: 30 }}
                placeholder={
                  user.phoneNumber && user.phoneNumber.trim() !== ""
                    ? t("profile.updatePhone")
                    : t("profile.addPhoneNumber")
                }
                {...register("phoneNumber")}
              />
              <Button
                variant="contained"
                type="submit"
                fullWidth
                className="UpdateBtn"
              >
                {t("profile.updateProfile")}
              </Button>
            </form>
          </div>
        </Dialog>

        <img className="ImagePreview" src={imagePreview || fallbackAvatar} />

        <TextField
          variant="standard"
          InputProps={{ disableUnderline: true }}
          type="file"
          inputProps={{ accept: "image/*" }}
          onChange={async (e) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];

            if (!file) return;

            const uri = URL.createObjectURL(file);
            setSelectedFile(file);
            setImagePreview(uri);

            const formData = new FormData();
            formData.append("id", String(user.id));
            formData.append("firstName", user.firstName);
            formData.append("familyName", user.familyName);
            formData.append("email", user.email);
            formData.append("phoneNumber", (user.phoneNumber ?? "").toString());
            formData.append("image", file);

            try {
              await userService.updateUserInfo(user.id!, formData);
              notify.success(`${t("profile.imageUpdated")}`);
              setSelectedFile(null);
            } catch (err) {
              notify.error(err);
            }
          }}
        />

        <h3 className="Name">
          {user.firstName} {user.familyName}
        </h3>

        {(ageText || genderText) && (
          <p>{[ageText, genderText].filter(Boolean).join(", ")}</p>
        )}

        <div className="divider" />

        <p>
          {user.email}
        </p>

        {user.phoneNumber && user.phoneNumber.trim() !== "" && (
          <p>
            {user.phoneNumber}
          </p>
        )}
        {birthDateStr && (
          <p>
            {birthDateStr}
          </p>
        )}
      </div>
    </div>
  );
}
