<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';

	let { open, message, onConfirm, onCancel } = $props();
</script>

<AlertDialog.Root {open}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Confirm Action</AlertDialog.Title>
			<AlertDialog.Description>
				{message}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={onCancel}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={onConfirm}>Confirm</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
