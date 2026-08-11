import express from 'express';
import { handler as triggerWorkflowRun } from './trigger-workflow-run';
import { handler as executeStep } from './execute-step';
import { handler as approveStep } from './approve-step';
import { handler as createOrganization } from './create-organization';

const app = express();
app.use(express.json());

app.post('/trigger-workflow-run', async (req, res) => {
  try {
    const result = await triggerWorkflowRun(req.body);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/execute-step', async (req, res) => {
  try {
    const result = await executeStep(req.body);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/approve-step', async (req, res) => {
  try {
    const result = await approveStep(req.body);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/create-organization', async (req, res) => {
  try {
    const result = await createOrganization(req.body);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
