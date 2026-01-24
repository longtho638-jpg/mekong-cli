import asyncio
import os

import discord
from discord.ext import commands

# AgencyOS Community Bot Skeleton
# Handles: Welcome messages, Role assignment, Binh Pháp quotes

INTENTS = discord.Intents.default()
INTENTS.members = True
INTENTS.message_content = True

bot = commands.Bot(command_prefix='/', intents=INTENTS)

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user} (ID: {bot.user.id})')
    print('AgencyOS Community Bot is online.')

@bot.event
async def on_member_join(member):
    channel = discord.utils.get(member.guild.text_channels, name='general')
    if channel:
        await channel.send(f'Welcome to the AgencyOS Empire, {member.mention}! 🏯 Type `/help` to get started.')

@bot.command()
async def quote(ctx):
    """Sends a Binh Pháp strategy quote."""
    quotes = [
        "The supreme art of war is to subdue the enemy without fighting.",
        "Victory comes from finding opportunities in problems.",
        "Strategy without tactics is the slowest route to victory."
    ]
    import random
    await ctx.send(f"🏯 **Binh Pháp:** {random.choice(quotes)}")

if __name__ == '__main__':
    TOKEN = os.getenv('DISCORD_BOT_TOKEN')
    if TOKEN:
        bot.run(TOKEN)
    else:
        print("Error: DISCORD_BOT_TOKEN not found in environment.")
