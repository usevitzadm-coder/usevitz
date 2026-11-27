import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { onConsentChange } from "@/lib/consent";
import { syncMetaPixelConsent, trackMetaPageView } from "@/lib/meta-pixel";

const MetaPixelTracker = () => {
  const location = useLocation();
  const pageKey = `${location.pathname}${location.search}${location.hash}`;
  const currentPage = useRef(pageKey);
  currentPage.current = pageKey;

  useEffect(() => {
    void trackMetaPageView(pageKey);
  }, [pageKey]);

  useEffect(() => onConsentChange(() => {
    void syncMetaPixelConsent().then((permitted) => {
      if (permitted) void trackMetaPageView(currentPage.current);
    });
  }), []);

  return null;
};

export default MetaPixelTracker;
