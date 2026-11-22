import PageHeader from "./ui/PageHeader.jsx";
import { LogoMark } from "./Logo.jsx";

/**
 * Shared frame for the two public sign-in screens. The form alone left a small
 * card floating in a very large empty page, so the photograph carries the
 * other half and explains what the account is for. It hides below lg, where a
 * phone has no room for it.
 */
export default function AuthShell({ title, subtitle, image, imageAlt, claim, children }) {
  return (
    <div className="shell-wrap page">
      <div className="grid gap-12 lg:grid-cols-[1fr_440px] lg:items-center">
        <aside className="relative hidden overflow-hidden rounded-3xl bg-slate-200 lg:block dark:bg-slate-800 aspect-[4/5] max-h-[640px]">
          <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
          <div className="photo-scrim" />
          <div className="absolute inset-x-0 bottom-0 z-10 p-10">
            <LogoMark size={32} />
            <p className="display m-0 mt-3 text-3xl leading-tight text-white">{claim}</p>
          </div>
        </aside>

        <div className="w-full max-w-md mx-auto lg:mx-0 lg:max-w-none">
          <PageHeader title={title} subtitle={subtitle} />
          {children}
        </div>
      </div>
    </div>
  );
}
