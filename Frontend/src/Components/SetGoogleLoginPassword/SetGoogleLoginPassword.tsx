import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, IconButton, InputAdornment } from "@mui/material";
import { t } from "i18next";
import { useEffect, useState } from "react";
import i18n from "../../Utils/i18n";
import { Visibility, VisibilityOff } from "@mui/icons-material";


export function SetGoogleLoginPassword({
    open,
    onSubmit,
    onLater,
}: {
    open: boolean;
    onSubmit: (password: string) => Promise<void>;
    onLater: () => void;
}) {

    const isHebrew = (lng?: string) => (lng ?? "").startsWith("he");
    const [isRTL, setIsRTL] = useState(() => isHebrew(i18n.language));

    useEffect(() => {
        const onLangChange = (lng: string) => setIsRTL(isHebrew(lng));
        i18n.on("languageChanged", onLangChange);
        return () => {
            i18n.off("languageChanged", onLangChange);
        };
    }, [i18n]);


    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");

    return (
        <Dialog open={open} onClose={onLater}>
            <DialogTitle>{t("auth.login.googlePassword")}</DialogTitle>
            <DialogContent>
                <TextField className="InputTextField"
                    autoComplete="password"
                    label={t("auth.login.passwordLabel")}
                    placeholder={t("auth.login.passwordPlaceholder")}
                    fullWidth
                    size="small"
                    type={
                        showPassword ? "text" : "password"
                    }
                    onChange={(e) => setPassword(e.target.value)}
                    InputProps={{...(isRTL ? {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <IconButton
                                            edge="start"
                                            tabIndex={-1}
                                            onClick={() => setShowPassword((show) => !show)}
                                            aria-label={showPassword ? "Hide password" : "Show password"} >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            } : {
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
                                )
                            })
                    }}>
                </TextField>
                <DialogActions>
                    <Button onClick={onLater}>{t("auth.login.later")}</Button>
                    <Button variant="contained" onClick={() => onSubmit(password)}>
                        {t("auth.login.update")}
                    </Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    );
}
