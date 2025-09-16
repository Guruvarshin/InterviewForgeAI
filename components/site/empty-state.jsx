import { Card, CardContent } from "@/components/ui/card";

export default function EmptyState({ title = "Nothing yet", hint }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 p-10 text-center">
        <p className="text-base font-medium">{title}</p>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
