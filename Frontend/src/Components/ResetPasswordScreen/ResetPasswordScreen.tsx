import { useTranslation } from "react-i18next";
import "./ResetPasswordScreen.css";
import { useTitle } from "../../Utils/Utils";
import { useEffect, useRef, useState } from "react";
import i18n from "../../Utils/i18n";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { notify } from "../../Utils/Notify";
import { Button, IconButton, InputAdornment, TextField, } from "@mui/material";
import { ArrowBackIosNew ,Visibility, VisibilityOff} from "@mui/icons-material";
import EmailIcon from '@mui/icons-material/Email';
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "../../Redux/Store";
import { clearReset, setEmail, setResetId, setStep, setToken } from "../../Redux/ResetSlice";
import { AuthResponseCode, resetPasswordService } from "../../Services/ResetPasswordService";


type ResetPasswordForm = {
    email: string;
};
export function ResetPasswordScreen() {
    useTitle("Reset password");
    const { t } = useTranslation();
    const [isRTL, setIsRTL] = useState<boolean>(() =>
        (i18n.language ?? "").startsWith("he")
    );
    const resetState = useSelector((state: AppState) => state.passwordReset);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { register, handleSubmit, setValue } = useForm<ResetPasswordForm>({ defaultValues: { email: resetState.email || "" } });
    const [newPassword, setNewPassword] = useState("");
    function onlyDigits(value: string) {
        return (value ?? "").replace(/\D/g, "");
    }
    const [incomingDigit, setAllDigitsCombined] = useState<string[]>(() => {
        const v = onlyDigits(resetState.token);
        return v
            .padEnd(6, " ")
            .slice(0, 6)
            .split("")
            .map(c => (c === " " ? "" : c));
    }
    )
     const [showPassword, setShowPassword] = useState(false);
    const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
    const otpValue = incomingDigit.join("");

    useEffect(() => {
        dispatch(setToken(otpValue))
    }, []);

    useEffect(() => {
        const onLangChange = (lng: string) => setIsRTL((lng ?? "").startsWith("he"));
        i18n.on("languageChanged", onLangChange);
        return () => i18n.off("languageChanged", onLangChange);
    }, [i18n]);

    function returnToLogin() {
        dispatch(clearReset());
        navigate("/home");
    }

    async function send(data: ResetPasswordForm) {
        try {
            const email = (data.email ?? "").trim();
            dispatch(setEmail(email));

            const receivedCode = await resetPasswordService.requestOtpCode(email);
            const resetIdFromServer = typeof receivedCode?.params?.resetId === "number" ? (receivedCode.params.resetId as number) : -1;

            dispatch(setResetId(resetIdFromServer));
            dispatch(setStep("enterCode"))
            notify.success(t("auth.login.codeSent"));
            setAllDigitsCombined(["", "", "", "", "", "", ""])
            //setTimeout(() => otpRefs.current[0]?.focus(), 50); waits for the send to finnish so that the otp shows upo and ficus in the otp bix happens automatically
        } catch (err) {
            notify.error(err)
        }
    }

    function onOtpChange(index: number, value: string) {
        const digit = onlyDigits(value).slice(-1); // keep only 1 digit
        const next = [...incomingDigit];
        next[index] = digit;
        setAllDigitsCombined(next);

        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    }

    function onOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Backspace") {
            if (incomingDigit[index]) {
                const next = [...incomingDigit];
                next[index] = "";
                setAllDigitsCombined(next);
                return;
            }
            if (index > 0) otpRefs.current[index - 1]?.focus();
        }
    }

    function onOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
        const pasted = onlyDigits(e.clipboardData.getData("text")).slice(0, 6);
        if (!pasted) return;

        const next = Array.from({ length: 6 }, (_, i) => pasted[i] ?? "");
        setAllDigitsCombined(next);
        const last = Math.min(5, pasted.length - 1);
        setTimeout(() => otpRefs.current[last]?.focus(), 0);
        e.preventDefault();
    }

    function submitCode() {
        const token = onlyDigits(otpValue);
        if (token.length !== 6) {
            notify.error(t("auth.login.invalidCode"));
            return;
        }
        dispatch(setStep("enterNewPassword"));
    };

    async function updatePassword() {
        try {
            const token = onlyDigits(resetState.token);
            if (token.length !== 6) {
                notify.error(t("auth.login.invalidCode"));
                dispatch(setStep("enterCode"));
                return;
            }
            if (!newPassword || newPassword.length < 8) {
                notify.error(t("auth.registration.passwordMin8"));
                return;
            }
 
            const resetId = resetState.resetId ?? -1;
            const res = await resetPasswordService.resetPassword(resetId, token, newPassword);


            if (res.code === AuthResponseCode.PasswordResetSuccess) {
                notify.success(t("auth.login.passwordUpdated"));
                dispatch(setStep("finnish"));
                returnToLogin();
                return;
            }

            if (res.code === AuthResponseCode.PasswordResetExpired) {
                notify.error(t("auth.login.expiredCode"));
                dispatch(setStep("enterCode"));
                return;
            }
            if (res.code === AuthResponseCode.PasswordResetUsed) {
                notify.error(t("auth.login.usedCode"));
                dispatch(setStep("enterCode"));
                return;
            }
            notify.error(t("auth.login.invalidCode"));
            dispatch(setStep("enterCode"));
        } catch (err) {
            notify.error(err);
        }
    }


    async function resendCode() {
        try {
            const email = (resetState.email ?? "").trim();
            const res = await resetPasswordService.requestOtpCode(email)
            const resetIdFromServer = typeof res?.params?.resetId === "number" ? (res.params.resetId as number) : -1;
            dispatch(setResetId(resetIdFromServer));
            setAllDigitsCombined(["", "", "", "", "", ""]);
            notify.success(t("auth.login.codeSent"));
        } catch (err) {
            notify.error(err);
        };
    }


    useEffect(() => {
        setValue("email", resetState.email || "");
    }, [resetState.email, setValue])

    const setOtpRef = (i: number) => (el: HTMLInputElement | null) => {
        otpRefs.current[i] = el;
    };


    return (
        <div className="ResetPasswordScreen">
            <form className="ResetForm" onSubmit={handleSubmit(send)}>

                <Button className="BackBtn" variant="contained" onClick={returnToLogin}>
                    <ArrowBackIosNew />
                    {t("auth.registration.back")}
                </Button>

                <h2 className="ResetTitle">{t("auth.login.reset")}</h2>

                {resetState.step === "enterEmail" && (
                    <>
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
                        />

                        <Button type="submit"
                            className="LoginScreenBtn"
                            variant="contained">
                            {t("auth.login.sendCode")}
                        </Button>
                    </>
                )
                }

                {resetState.step === "enterCode" && (
                    <>
                        <div>{t("auth.login.enterCode")}</div>

                        <div className="OtpRow">
                            {
                                Array.from({ length: 6 }).map((_, i) => (
                                    <input
                                        key={i}
                                        className="OtpBox"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={incomingDigit[i] ?? ""}
                                        ref={setOtpRef(i)}
                                        onChange={(e) => onOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => onOtpKeyDown(i, e)}
                                        onPaste={onOtpPaste}
                                    />
                                ))
                            }
                        </div>
                        <Button
                            type="button"
                            className="LoginScreenBtn"
                            variant="contained"
                            onClick={submitCode}
                        >
                            {t("auth.login.submitCode")}
                        </Button>

                        <Button
                            type="button"
                            variant="text"
                            onClick={resendCode}
                            style={{ textTransform: "none" }}
                        >
                            {t("auth.login.resendCode")}
                        </Button>
                    </>
                )
                }


                {resetState.step === "enterNewPassword" && (
                    <>
                        <div className="PasswordRow">
                            <TextField className="NewPasswordTextField"
          autoComplete="password"
          label={t("auth.login.passwordLabel")}
           placeholder={t("auth.login.newPassword")}
          fullWidth
          type= "password"
        onChange={(e) => setNewPassword(e.target.value)}
          InputProps={{
            ...(isRTL
              ? {
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton
                    
                      edge="start"
                      tabIndex={-1}
                      onClick={() => setShowPassword((show) => !show)}
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
                      value={newPassword}
                      tabIndex={-1}
                      onClick={() => setShowPassword((show) => !show)}
                      
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }),
          }}
        />
                        </div>

                        <Button
                            type="button"
                            className="LoginScreenBtn"
                            variant="contained"
                            onClick={updatePassword}
                            
                        >{t("auth.registration.update")}</Button>
                    </>
                )}

                {resetState.step === "finnish" && (
                    <>
                        <div>{t("auth.login.passwordUpdated")}</div>
                        <Button type="button" variant="contained" onClick={returnToLogin}>
                            {t("auth.registration.back")}
                        </Button>
                    </>
                )}
            </form>
        </div>
    );
};
