import { useEffect } from "react";

/** Sets the browser tab title for the page it is rendered in. */
const PageTitle = ({ title }: { title: string }) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return null;
};

export default PageTitle;
