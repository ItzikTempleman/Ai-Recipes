import "./AskChefDialog.css";
import { useEffect, useRef, useState } from "react";
import { Dialog, IconButton, InputAdornment, TextField, CircularProgress } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { RecipeModel } from "../../../Models/RecipeModel";
import { recipeService } from "../../../Services/RecipeService";
import { useTranslation } from "react-i18next";
import chef from "../../../Assets/images/chef.png";

export type ChatMsg = { role: "user" | "assistant"; content: string };

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

  const endRef = useRef<HTMLDivElement | null>(null);

 
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


  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [open, messages.length, askError, loading]);

  async function sendNow() {
    const q = draft.trim();
    if (q.length < 2 || loading) return;

    setLoading(true);
    setAskError(null);

    setMessages(prev => [...prev, { role: "user", content: q }]);
    setDraft("");

    try {
  
     const history: ChatMsg[] = [...messages, { role: "user", content: q }];
      const answer = await recipeService.askRecipeQuestion(recipe, q, history);

      setMessages(prev => [...prev, { role: "assistant", content: answer }]);
    } catch (err: any) {
      const msg = err?.response?.data ?? err?.message ?? "Ask failed";
      setAskError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  const dir = isRTL ? "rtl" : "ltr";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={false}
      maxWidth="sm"
      fullWidth
      className="AskDialog"
    >
      <div className={`AskWrap ${dir}`} dir={dir}>

        <div className="AskPanel">
          <div className={`AskChat ${messages.length === 0 ? "isEmpty" : ""}`}>
            {messages.length === 0 && (
               <img className="ChefImageBlankMessage" src={chef} />
            )}

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`AskBubble ${m.role === "user" ? "user" : "assistant"}`}
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="AskBubble assistant AskTyping">
                <CircularProgress size={16} />
                <span className="AskTypingText">{t("recipeUi.thinking")}</span>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {askError && <div className="AskErrorLine">{askError}</div>}

  
          <div className="AskComposer">
            <TextField
              className="AskComposerField"
              fullWidth
              multiline
              maxRows={4}
              placeholder={t("recipeUi.ask")}
              value={draft}
              onChange={(e) => setDraft(e.target.value ?? "")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendNow();
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      className="AskSendBtn"
                      onClick={sendNow}
                      disabled={loading || draft.trim().length < 2}
                    >
                      {loading ? (
                        <CircularProgress size={18} />
                      ) : (
                        <SendIcon className={`AskSendIcon ${dir}`} />
                      )}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
