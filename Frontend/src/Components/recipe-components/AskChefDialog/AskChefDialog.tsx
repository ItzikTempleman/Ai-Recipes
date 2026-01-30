import "./AskChefDialog.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, IconButton, InputAdornment, TextField, CircularProgress } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { RecipeModel } from "../../../Models/RecipeModel";
import { recipeService } from "../../../Services/RecipeService";
import { useTranslation } from "react-i18next";

export type ChatMsg = { role: "user" | "assistant"; content: string };

function buildTranscript(msgs: ChatMsg[], isRTL: boolean) {
  const you = isRTL ? "אתה" : "You";
  const chef = isRTL ? "השף" : "Chef";

  return msgs
    .map(m => {
      const label = m.role === "user" ? you : chef;
      return `${label}: ${m.content}`.trim();
    })
    .join("\n\n");
}

function extractDraft(full: string, transcript: string) {
  if (!transcript) return full;
  const prefix = transcript + "\n\n";
  if (full.startsWith(prefix)) return full.slice(prefix.length);
  const idx = full.lastIndexOf("\n\n");
  return idx >= 0 ? full.slice(idx + 2).trimStart() : "";
}

type Props = {
  open: boolean;
  onClose: () => void;
  recipe: RecipeModel;
  isRTL: boolean;
};

export function AskChefDialog({ open, onClose, recipe, isRTL }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    if (open) return;
    setMessages([]);
    setDraft("");
    setAskError(null);
    setLoading(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setMessages([]);
    setDraft("");
    setAskError(null);
    setLoading(false);
  }, [recipe.id, open]);

  const transcript = useMemo(() => buildTranscript(messages, isRTL), [messages, isRTL]);
  const composedValue = useMemo(() => {
    if (!transcript) return draft;
    return `${transcript}\n\n${draft}`;
  }, [transcript, draft]);
  useEffect(() => {
    if (!open) return;
    const el = textAreaRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, messages.length, askError, loading]);

  async function sendNow() {
    const q = draft.trim();
    if (q.length < 2 || loading) return;

    setLoading(true);
    setAskError(null);
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setDraft("");

    try {
   
      const answer = await recipeService.askRecipeQuestion(recipe, q, messages);
      setMessages(prev => [...prev, { role: "assistant", content: answer }]);
    } catch (err: any) {
      const msg = err?.response?.data ?? err?.message ?? "Ask failed";
      setAskError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={false}
      maxWidth="sm"
      fullWidth
      className="AskDialog"
    >
      <div className={`AskWrap ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        <TextField
          className="AskTextField"
          fullWidth
          multiline
          minRows={10}
          placeholder={t("recipeUi.ask")}
          value={composedValue}
          onChange={(e) => {
            const full = e.target.value ?? "";
            const nextDraft = extractDraft(full, transcript);
            setDraft(nextDraft);
          }}
          onKeyDown={(e) => {
 
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendNow();
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" className="AskAdornment">
                <IconButton
                  type="button"
                  className="AskSendBtn"
                  onClick={sendNow}
                  disabled={loading || draft.trim().length < 2}
                >
                  {loading ? (
                    <CircularProgress size={18} />
                  ) : (
                    <SendIcon className={`AskSendIcon ${isRTL ? "rtl" : "ltr"}`} />
                  )}
                </IconButton>
              </InputAdornment>
            ),
            inputRef: (el: any) => {

              const ta = el?.querySelector?.("textarea") as HTMLTextAreaElement | null;
              if (ta) textAreaRef.current = ta;
            },
          }}
        />

        {askError && <div className="AskErrorLine">{askError}</div>}
      </div>
    </Dialog>
  );
}
