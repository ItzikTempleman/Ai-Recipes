import { useTranslation } from "react-i18next";
import "./ResetPasswordScreen.css";
import { useTitle } from "../../Utils/Utils";
import { useEffect, useState } from "react";
import i18n from "../../Utils/i18n";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { notify } from "../../Utils/Notify";
import { Button, InputAdornment, TextField } from "@mui/material";
import { ArrowBackIosNew } from "@mui/icons-material";
import EmailIcon from '@mui/icons-material/Email';
import { userService } from "../../Services/UserService";

type ResetPasswordForm = {
    email: string;
};

export function ResetPasswordScreen() {
    useTitle("Reset password");
    const { t } = useTranslation();

    const [isRTL, setIsRTL] = useState<boolean>(() =>
        (i18n.language ?? "").startsWith("he")
    );
    const { register, handleSubmit } = useForm<ResetPasswordForm>();

    const navigate = useNavigate();

    function returnToLogin() {
        navigate("/home");
    }


    async function send(data: ResetPasswordForm) {
        try {
           await userService.forgotPassword(data.email); 
        } catch (err) {
            notify.error(err)
        }
    }

    useEffect(() => {
        const onLangChange = (lng: string) => setIsRTL((lng ?? "").startsWith("he"));
        i18n.on("languageChanged", onLangChange);
        return () => i18n.off("languageChanged", onLangChange);
    }, [i18n]);


    return (
        <div className="ResetPasswordScreen">
            <form className="ResetForm" onSubmit={handleSubmit(send)}>

                <Button className="BackBtn" variant="contained" onClick={returnToLogin}>
                    <ArrowBackIosNew />
                    {t("auth.registration.back")}
                </Button>

                <h2 className="ResetTitle">{t("auth.login.reset")}</h2>

                <TextField className="InputTextField"
                    autoComplete="email" label={t("auth.login.emailLabelToSendCode")} placeholder={t("auth.login.emailLabelToSendCode")} fullWidth
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
                    ...register("email")
                    }
                ></TextField>
                <Button type="submit"
                    className="LoginScreenBtn"
                    variant="contained">
                    {t("auth.login.sendCode")}
                </Button>
            </form>
        </div>
    );
}
