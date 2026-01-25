"""
Django management command to create missing commission records for active policies.

Usage:
    python manage.py sync_commissions
"""
from django.core.management.base import BaseCommand
from app.models import MotorPolicy, AgentCommission
from app.services.commissioning import create_commission_for_policy


class Command(BaseCommand):
    help = 'Create commission records for active policies that are missing commissions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating records',
        )
        parser.add_argument(
            '--agent-id',
            type=int,
            help='Only process policies for a specific agent (user ID)',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        agent_id = options.get('agent_id')

        self.stdout.write('=' * 60)
        self.stdout.write(self.style.WARNING('COMMISSION SYNC UTILITY'))
        self.stdout.write('=' * 60)
        
        # Find active policies without commissions
        active_policies = MotorPolicy.objects.filter(status='ACTIVE')
        
        if agent_id:
            active_policies = active_policies.filter(user_id=agent_id)
            self.stdout.write(f'\nFiltering to agent ID: {agent_id}')
        
        total_active = active_policies.count()
        self.stdout.write(f'\nTotal ACTIVE policies: {total_active}')
        
        # Find which ones already have commissions
        policy_ids_with_commissions = list(
            AgentCommission.objects
            .exclude(policy__isnull=True)  # Skip orphaned commissions
            .values_list('policy_id', flat=True)
            .distinct()
        )
        policies_needing_commissions = active_policies.exclude(id__in=policy_ids_with_commissions)
        
        count_needing = policies_needing_commissions.count()
        count_already_have = total_active - count_needing
        
        self.stdout.write(f'Policies with commissions: {count_already_have}')
        self.stdout.write(f'Policies MISSING commissions: {count_needing}')
        
        if count_needing == 0:
            self.stdout.write(self.style.SUCCESS('\n✓ All active policies have commission records!'))
            return
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\n[DRY RUN MODE - No changes will be made]'))
        
        self.stdout.write('\n' + '-' * 60)
        self.stdout.write('Creating missing commissions...\n')
        
        created = 0
        skipped = 0
        errors = []
        
        for policy in policies_needing_commissions:
            try:
                agent_phone = policy.user.phonenumber if policy.user else 'No Agent'
                policy_info = f'{policy.policy_number} ({agent_phone})'
                
                if dry_run:
                    self.stdout.write(f'[DRY RUN] Would create commission for: {policy_info}')
                    created += 1
                else:
                    commission = create_commission_for_policy(policy)
                    if commission:
                        self.stdout.write(self.style.SUCCESS(
                            f'✓ Created commission for {policy_info}: '
                            f'KES {commission.commission_amount:,.2f}'
                        ))
                        created += 1
                    else:
                        self.stdout.write(self.style.WARNING(
                            f'⊘ Skipped {policy_info} (not eligible)'
                        ))
                        skipped += 1
            
            except ValueError as e:
                self.stdout.write(self.style.ERROR(f'✗ Error for {policy.policy_number}: {e}'))
                errors.append((policy.policy_number, str(e)))
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Unexpected error for {policy.policy_number}: {e}'))
                errors.append((policy.policy_number, f'Unexpected: {str(e)}'))
        
        # Summary
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.WARNING('SUMMARY'))
        self.stdout.write('=' * 60)
        self.stdout.write(f'\n  Created: {created}')
        self.stdout.write(f'  Skipped: {skipped}')
        self.stdout.write(f'  Errors:  {len(errors)}')
        
        if errors:
            self.stdout.write('\n' + '-' * 60)
            self.stdout.write('Errors:')
            for policy_num, err_msg in errors:
                self.stdout.write(f'  {policy_num}: {err_msg}')
        
        if not dry_run and created > 0:
            self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully created {created} commission records!'))
        elif dry_run:
            self.stdout.write(self.style.WARNING(
                f'\n[DRY RUN] Would create {created} commission records. '
                'Run without --dry-run to apply changes.'
            ))
        
        self.stdout.write('')
