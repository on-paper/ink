import type { User } from "@cartel-sh/ui";
import { MenuOption } from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { UserAvatar } from "../user/UserAvatar";

export class MentionOption extends MenuOption {
  user: User;

  constructor(user: User) {
    super(user.username);
    this.user = user;
  }
}

interface MentionMenuItemProps {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: MentionOption;
}

export function MentionMenuItem({ index, isSelected, onClick, onMouseEnter, option }: MentionMenuItemProps) {
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={`
        flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-md transition-colors text-sm
        ${isSelected ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}
      `}
      ref={option.setRefElement}
      aria-selected={isSelected}
      id={`typeahead-item-${index}`}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <div className="w-8 h-8">
        <UserAvatar user={option.user} link={false} card={false} />
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">@{option.user.username}</p>
      </div>
    </li>
  );
}
