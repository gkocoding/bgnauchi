import { Suspense } from "react";
import HomeworkContent from "./HomeworkContent";

export default function HomeworkPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center font-display text-lg">Зареждане...</div>}>
            <HomeworkContent />
        </Suspense>
    );
}