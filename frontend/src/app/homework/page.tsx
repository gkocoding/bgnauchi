import { Suspense } from "react";
import HomeworkContent from "./HomeworkContent";
import Loader from "@/components/Loader";

export default function HomeworkPage() {
    return (
        <Suspense fallback={<Loader />}>
            <HomeworkContent />
        </Suspense>
    );
}