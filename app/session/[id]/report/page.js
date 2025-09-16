import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CopyButton from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/site/page-header";

export default async function ReportPage({ params }) {
  const { id } = await params;

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/share/demo-${id}`;

  return (
    <section className="space-y-6">
      <PageHeader
        title={`Report • Session ${id}`}
        description="Scores, strengths, and improvements from your interview."
      >
        {/* Copy & Download (download is a placeholder until Step 14) */}
        <CopyButton getText={() => shareUrl}>Copy Share Link</CopyButton>
        <Button variant="outline" size="sm" disabled>
          Download PDF
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Scores</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge>Overall —</Badge>
            <Badge>Communication —</Badge>
            <Badge>Technical —</Badge>
            <Badge>Behavioral —</Badge>
            <Badge>Culture —</Badge>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Complete an interview to see detailed feedback here.
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
